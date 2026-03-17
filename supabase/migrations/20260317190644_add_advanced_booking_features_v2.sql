/*
  # Advanced Booking Features

  1. Purpose
    - Add preparation time buffers between appointments
    - Support multiple capacity for group services
    - Enable dynamic pricing based on time slots
    - Add automatic reminder system

  2. Updates to Existing Tables
    - `pet_masters`: Add buffer_minutes and max_concurrent_bookings
    - `service_hours`: Add pricing multipliers for peak hours
    - `bookings`: Add reminder timestamps

  3. New Tables
    - `price_modifiers`: Time-based pricing rules
    - `booking_reminders`: Track sent reminders

  4. Security
    - Enable RLS on new tables
    - Providers manage their own settings

  5. Functions
    - Calculate effective price with modifiers
    - Check capacity with concurrent bookings
*/

-- Add buffer time and capacity to pet_masters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'buffer_minutes'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN buffer_minutes integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'max_concurrent_bookings'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN max_concurrent_bookings integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'allow_group_bookings'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN allow_group_bookings boolean DEFAULT false;
  END IF;
END $$;

-- Add pricing multipliers to service_hours
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_hours' AND column_name = 'price_multiplier'
  ) THEN
    ALTER TABLE service_hours ADD COLUMN price_multiplier numeric(3,2) DEFAULT 1.00;
  END IF;
END $$;

-- Add reminder fields to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_24h_sent'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_24h_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_1h_sent'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_1h_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_24h_sent_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_24h_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'reminder_1h_sent_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN reminder_1h_sent_at timestamptz;
  END IF;
END $$;

-- Price modifiers table (for peak hours, holidays, etc.)
CREATE TABLE IF NOT EXISTS price_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  name text NOT NULL,
  modifier_type text NOT NULL CHECK (modifier_type IN ('time_of_day', 'day_of_week', 'date_range')),
  multiplier numeric(3,2) NOT NULL DEFAULT 1.00,
  start_time time,
  end_time time,
  days_of_week integer[],
  start_date date,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking reminders log
CREATE TABLE IF NOT EXISTS booking_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type text NOT NULL CHECK (reminder_type IN ('24h', '1h', 'custom')),
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed')),
  notification_method text DEFAULT 'push' CHECK (notification_method IN ('push', 'email', 'sms')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_price_modifiers_provider 
  ON price_modifiers(provider_id);

CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking 
  ON booking_reminders(booking_id);

CREATE INDEX IF NOT EXISTS idx_bookings_reminders 
  ON bookings(scheduled_date) 
  WHERE status IN ('pending', 'confirmed');

-- Enable RLS
ALTER TABLE price_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_modifiers

CREATE POLICY "Providers can view own price modifiers"
  ON price_modifiers
  FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can create own price modifiers"
  ON price_modifiers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can update own price modifiers"
  ON price_modifiers
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

CREATE POLICY "Providers can delete own price modifiers"
  ON price_modifiers
  FOR DELETE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM pet_masters WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view active price modifiers"
  ON price_modifiers
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for booking_reminders

CREATE POLICY "Users can view own booking reminders"
  ON booking_reminders
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE owner_id = auth.uid() 
         OR pet_master_id = auth.uid()
    )
  );

CREATE POLICY "System can create booking reminders"
  ON booking_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to check capacity with concurrent bookings
CREATE OR REPLACE FUNCTION check_booking_capacity(
  p_provider_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time
)
RETURNS boolean AS $$
DECLARE
  v_max_capacity integer;
  v_current_bookings integer;
BEGIN
  SELECT COALESCE(max_concurrent_bookings, 1)
  INTO v_max_capacity
  FROM pet_masters
  WHERE id = p_provider_id;
  
  SELECT COUNT(*)
  INTO v_current_bookings
  FROM time_slot_bookings
  WHERE provider_id = p_provider_id
    AND slot_date = p_date
    AND status IN ('confirmed', 'pending')
    AND (
      (p_start_time >= start_time AND p_start_time < end_time)
      OR (p_end_time > start_time AND p_end_time <= end_time)
      OR (p_start_time <= start_time AND p_end_time >= end_time)
    );
  
  RETURN v_current_bookings < v_max_capacity;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate effective price with modifiers
CREATE OR REPLACE FUNCTION calculate_effective_price(
  p_provider_id uuid,
  p_date date,
  p_start_time time,
  p_base_price numeric
)
RETURNS numeric AS $$
DECLARE
  v_day_of_week integer;
  v_multiplier numeric;
  v_final_price numeric;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  v_multiplier := 1.00;
  
  SELECT COALESCE(MAX(multiplier), 1.00)
  INTO v_multiplier
  FROM price_modifiers
  WHERE provider_id = p_provider_id
    AND is_active = true
    AND (
      (modifier_type = 'time_of_day' 
       AND p_start_time >= start_time 
       AND p_start_time < end_time)
      OR
      (modifier_type = 'day_of_week' 
       AND v_day_of_week = ANY(days_of_week))
      OR
      (modifier_type = 'date_range' 
       AND p_date >= start_date 
       AND p_date <= end_date)
    );
  
  v_final_price := p_base_price * v_multiplier;
  
  RETURN v_final_price;
END;
$$ LANGUAGE plpgsql STABLE;

-- Drop old function and create new version with additional fields
DROP FUNCTION IF EXISTS get_available_slots(uuid, date, integer);

CREATE FUNCTION get_available_slots(
  p_provider_id uuid,
  p_date date,
  p_duration_minutes integer DEFAULT 60
)
RETURNS TABLE(
  slot_start time,
  slot_end time,
  is_available boolean,
  price numeric,
  capacity_available integer
) AS $$
DECLARE
  v_day_of_week integer;
  v_open_time time;
  v_close_time time;
  v_is_closed boolean;
  v_slot_duration interval;
  v_buffer_minutes integer;
  v_base_price numeric;
BEGIN
  v_day_of_week := EXTRACT(DOW FROM p_date);
  v_slot_duration := (p_duration_minutes || ' minutes')::interval;
  
  SELECT 
    COALESCE(pm.buffer_minutes, 0),
    COALESCE(pm.hourly_rate, 0)
  INTO v_buffer_minutes, v_base_price
  FROM pet_masters pm
  WHERE pm.id = p_provider_id;
  
  SELECT open_time, close_time, is_closed
  INTO v_open_time, v_close_time, v_is_closed
  FROM service_hours
  WHERE pet_master_id = p_provider_id
    AND day_of_week = v_day_of_week
  LIMIT 1;
  
  IF NOT FOUND OR v_is_closed THEN
    RETURN;
  END IF;
  
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
  
  RETURN QUERY
  WITH RECURSIVE time_slots AS (
    SELECT 
      v_open_time as slot_start,
      (v_open_time + v_slot_duration) as slot_end
    UNION ALL
    SELECT 
      slot_end + (v_buffer_minutes || ' minutes')::interval,
      slot_end + (v_buffer_minutes || ' minutes')::interval + v_slot_duration
    FROM time_slots
    WHERE slot_end + (v_buffer_minutes || ' minutes')::interval + v_slot_duration <= v_close_time
  )
  SELECT 
    ts.slot_start,
    ts.slot_end,
    check_booking_capacity(p_provider_id, p_date, ts.slot_start, ts.slot_end) as is_available,
    calculate_effective_price(p_provider_id, p_date, ts.slot_start, v_base_price * (p_duration_minutes::numeric / 60)) as price,
    (
      SELECT COALESCE(max_concurrent_bookings, 1) - COUNT(*)
      FROM pet_masters pm
      LEFT JOIN time_slot_bookings tsb ON tsb.provider_id = pm.id
        AND tsb.slot_date = p_date
        AND tsb.status IN ('confirmed', 'pending')
        AND (
          (ts.slot_start >= tsb.start_time AND ts.slot_start < tsb.end_time)
          OR (ts.slot_end > tsb.start_time AND ts.slot_end <= tsb.end_time)
          OR (ts.slot_start <= tsb.start_time AND ts.slot_end >= tsb.end_time)
        )
      WHERE pm.id = p_provider_id
      GROUP BY pm.max_concurrent_bookings
    )::integer as capacity_available
  FROM time_slots ts
  WHERE NOT EXISTS (
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
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get bookings that need reminders
CREATE OR REPLACE FUNCTION get_bookings_needing_reminders()
RETURNS TABLE(
  booking_id uuid,
  owner_id uuid,
  provider_id uuid,
  scheduled_date timestamptz,
  reminder_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.owner_id,
    b.pet_master_id as provider_id,
    b.scheduled_date,
    '24h'::text as reminder_type
  FROM bookings b
  WHERE b.status IN ('pending', 'confirmed')
    AND b.reminder_24h_sent = false
    AND b.scheduled_date > now()
    AND b.scheduled_date <= now() + interval '25 hours'
    AND b.scheduled_date >= now() + interval '23 hours'
  
  UNION ALL
  
  SELECT 
    b.id as booking_id,
    b.owner_id,
    b.pet_master_id as provider_id,
    b.scheduled_date,
    '1h'::text as reminder_type
  FROM bookings b
  WHERE b.status IN ('pending', 'confirmed')
    AND b.reminder_1h_sent = false
    AND b.scheduled_date > now()
    AND b.scheduled_date <= now() + interval '2 hours'
    AND b.scheduled_date >= now() + interval '55 minutes';
END;
$$ LANGUAGE plpgsql STABLE;