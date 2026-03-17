/*
  # Provider Availability System

  1. Purpose
    - Enable providers to set their available days and time slots
    - Support booking validation and conflict prevention
    - Allow providers to block specific dates or times

  2. New Tables
    - `provider_availability_exceptions`: One-time date/time blocks or overrides
      - id (uuid, primary key)
      - provider_id (uuid, foreign key to pet_masters)
      - exception_date (date)
      - is_available (boolean) - true for special availability, false for blocked days
      - start_time (time) - null means all day
      - end_time (time) - null means all day
      - reason (text, optional)
      - created_at (timestamptz)

    - `time_slot_bookings`: Track which time slots are booked
      - id (uuid, primary key)
      - provider_id (uuid, foreign key to pet_masters)
      - booking_id (uuid, foreign key to bookings)
      - slot_date (date)
      - start_time (time)
      - end_time (time)
      - status (text) - pending, confirmed, completed, cancelled
      - created_at (timestamptz)

  3. Updates to Existing Tables
    - Update service_hours to ensure proper time slot management

  4. Security
    - Enable RLS on all new tables
    - Providers can manage their own availability
    - Users can view provider availability (read-only)

  5. Indexes
    - Add indexes for efficient availability queries
*/

-- Provider Availability Exceptions (blocked days, special hours, holidays)
CREATE TABLE IF NOT EXISTS provider_availability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  is_available boolean DEFAULT false,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Time Slot Bookings (tracks actual booked time slots)
CREATE TABLE IF NOT EXISTS time_slot_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_provider_exceptions_provider_date 
  ON provider_availability_exceptions(provider_id, exception_date);

CREATE INDEX IF NOT EXISTS idx_time_slot_bookings_provider_date 
  ON time_slot_bookings(provider_id, slot_date);

CREATE INDEX IF NOT EXISTS idx_time_slot_bookings_booking 
  ON time_slot_bookings(booking_id);

CREATE INDEX IF NOT EXISTS idx_service_hours_provider 
  ON service_hours(pet_master_id, day_of_week);

-- Enable RLS
ALTER TABLE provider_availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slot_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_availability_exceptions

-- Providers can view and manage their own availability exceptions
CREATE POLICY "Providers can view own availability exceptions"
  ON provider_availability_exceptions
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can create own availability exceptions"
  ON provider_availability_exceptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can update own availability exceptions"
  ON provider_availability_exceptions
  FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can delete own availability exceptions"
  ON provider_availability_exceptions
  FOR DELETE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

-- Users can view provider availability exceptions (for booking)
CREATE POLICY "Users can view provider availability exceptions"
  ON provider_availability_exceptions
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for time_slot_bookings

-- Providers can view their time slot bookings
CREATE POLICY "Providers can view own time slot bookings"
  ON time_slot_bookings
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
    OR
    booking_id IN (
      SELECT id FROM bookings WHERE owner_id = auth.uid()
    )
  );

-- System can create time slot bookings (during booking creation)
CREATE POLICY "System can create time slot bookings"
  ON time_slot_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM bookings WHERE id = booking_id
    )
    OR
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

-- Providers and booking owners can update time slot status
CREATE POLICY "Providers and owners can update time slot bookings"
  ON time_slot_bookings
  FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
    OR
    booking_id IN (
      SELECT id FROM bookings WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
    OR
    booking_id IN (
      SELECT id FROM bookings WHERE owner_id = auth.uid()
    )
  );

-- Function to get available time slots for a provider on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_provider_id uuid,
  p_date date,
  p_duration_minutes integer DEFAULT 60
)
RETURNS TABLE(
  slot_start time,
  slot_end time,
  is_available boolean
) AS $$
DECLARE
  v_day_of_week integer;
  v_open_time time;
  v_close_time time;
  v_is_closed boolean;
  v_slot_duration interval;
BEGIN
  -- Get day of week (0 = Sunday, 6 = Saturday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  v_slot_duration := (p_duration_minutes || ' minutes')::interval;
  
  -- Check if provider has service hours for this day
  SELECT open_time, close_time, is_closed
  INTO v_open_time, v_close_time, v_is_closed
  FROM service_hours
  WHERE pet_master_id = p_provider_id
    AND day_of_week = v_day_of_week
  LIMIT 1;
  
  -- If no hours set or closed, return empty
  IF NOT FOUND OR v_is_closed THEN
    RETURN;
  END IF;
  
  -- Check for exception on this date (full day block)
  IF EXISTS (
    SELECT 1 FROM provider_availability_exceptions
    WHERE provider_id = p_provider_id
      AND exception_date = p_date
      AND is_available = false
      AND start_time IS NULL
      AND end_time IS NULL
  ) THEN
    RETURN;
  END IF;
  
  -- Generate time slots and check availability
  RETURN QUERY
  WITH RECURSIVE time_slots AS (
    SELECT 
      v_open_time as slot_start,
      (v_open_time + v_slot_duration) as slot_end
    UNION ALL
    SELECT 
      slot_end,
      slot_end + v_slot_duration
    FROM time_slots
    WHERE slot_end + v_slot_duration <= v_close_time
  )
  SELECT 
    ts.slot_start,
    ts.slot_end,
    NOT EXISTS (
      SELECT 1 FROM time_slot_bookings tsb
      WHERE tsb.provider_id = p_provider_id
        AND tsb.slot_date = p_date
        AND tsb.status IN ('confirmed', 'pending')
        AND (
          (ts.slot_start >= tsb.start_time AND ts.slot_start < tsb.end_time)
          OR (ts.slot_end > tsb.start_time AND ts.slot_end <= tsb.end_time)
          OR (ts.slot_start <= tsb.start_time AND ts.slot_end >= tsb.end_time)
        )
    ) AND NOT EXISTS (
      SELECT 1 FROM provider_availability_exceptions pae
      WHERE pae.provider_id = p_provider_id
        AND pae.exception_date = p_date
        AND pae.is_available = false
        AND pae.start_time IS NOT NULL
        AND pae.end_time IS NOT NULL
        AND (
          (ts.slot_start >= pae.start_time AND ts.slot_start < pae.end_time)
          OR (ts.slot_end > pae.start_time AND ts.slot_end <= pae.end_time)
          OR (ts.slot_start <= pae.start_time AND ts.slot_end >= pae.end_time)
        )
    ) as is_available
  FROM time_slots ts;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_time_slot_available(
  p_provider_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time
)
RETURNS boolean AS $$
DECLARE
  v_day_of_week integer;
  v_is_available boolean;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Check service hours
  IF NOT EXISTS (
    SELECT 1 FROM service_hours
    WHERE pet_master_id = p_provider_id
      AND day_of_week = v_day_of_week
      AND is_closed = false
      AND open_time <= p_start_time
      AND close_time >= p_end_time
  ) THEN
    RETURN false;
  END IF;
  
  -- Check for exceptions (blocked times)
  IF EXISTS (
    SELECT 1 FROM provider_availability_exceptions
    WHERE provider_id = p_provider_id
      AND exception_date = p_date
      AND is_available = false
      AND (
        (start_time IS NULL AND end_time IS NULL)
        OR (
          start_time IS NOT NULL 
          AND end_time IS NOT NULL
          AND (
            (p_start_time >= start_time AND p_start_time < end_time)
            OR (p_end_time > start_time AND p_end_time <= end_time)
            OR (p_start_time <= start_time AND p_end_time >= end_time)
          )
        )
      )
  ) THEN
    RETURN false;
  END IF;
  
  -- Check for existing bookings
  IF EXISTS (
    SELECT 1 FROM time_slot_bookings
    WHERE provider_id = p_provider_id
      AND slot_date = p_date
      AND status IN ('confirmed', 'pending')
      AND (
        (p_start_time >= start_time AND p_start_time < end_time)
        OR (p_end_time > start_time AND p_end_time <= end_time)
        OR (p_start_time <= start_time AND p_end_time >= end_time)
      )
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;