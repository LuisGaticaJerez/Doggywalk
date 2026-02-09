/*
  # Recurring Bookings System

  ## 1. New Tables

  ### recurring_booking_series
  - `id` (uuid, primary key)
  - `owner_id` (uuid, references pet_masters)
  - `provider_id` (uuid, references pet_masters)
  - `pet_ids` (jsonb) - Array of pet IDs for multi-pet bookings
  - `frequency` (text) - 'daily', 'weekly', 'monthly'
  - `interval_count` (integer) - Every X days/weeks/months (default 1)
  - `days_of_week` (jsonb) - For weekly: [0,1,2,3,4,5,6] where 0=Sunday
  - `time_of_day` (time) - What time each booking should occur
  - `duration_minutes` (integer)
  - `pickup_address` (text)
  - `pickup_latitude` (decimal)
  - `pickup_longitude` (decimal)
  - `special_instructions` (text, nullable)
  - `service_name` (text)
  - `total_amount` (decimal)
  - `start_date` (date) - When series starts
  - `end_date` (date, nullable) - When series ends (null = indefinite)
  - `max_occurrences` (integer, nullable) - Max number of bookings to create
  - `occurrences_created` (integer, default 0) - Count of bookings created so far
  - `is_active` (boolean, default true) - Can be paused/stopped
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 2. Modified Tables

  ### bookings
  - Add `recurring_series_id` (uuid, references recurring_booking_series, nullable)
  - Add `is_recurring` (boolean, default false)
  - Add `occurrence_number` (integer, nullable) - Which occurrence in the series

  ## 3. Security
  - Enable RLS on recurring_booking_series
  - Users can only manage their own recurring series
  - Providers can view series where they are the provider

  ## 4. Important Notes
  - Recurring series automatically generate future bookings
  - Users can cancel individual bookings or entire series
  - Editing a series only affects future bookings
  - System will generate bookings up to 3 months in advance
*/

-- Create recurring_booking_series table
CREATE TABLE IF NOT EXISTS recurring_booking_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES pet_masters(id) ON DELETE CASCADE NOT NULL,
  provider_id uuid REFERENCES pet_masters(id) ON DELETE CASCADE NOT NULL,
  pet_ids jsonb NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  interval_count integer DEFAULT 1 CHECK (interval_count > 0),
  days_of_week jsonb,
  time_of_day time NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  pickup_address text NOT NULL,
  pickup_latitude decimal NOT NULL,
  pickup_longitude decimal NOT NULL,
  special_instructions text,
  service_name text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date,
  max_occurrences integer,
  occurrences_created integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add recurring fields to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'recurring_series_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN recurring_series_id uuid REFERENCES recurring_booking_series(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_recurring boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'occurrence_number'
  ) THEN
    ALTER TABLE bookings ADD COLUMN occurrence_number integer;
  END IF;
END $$;

-- Update trigger for recurring_booking_series
CREATE OR REPLACE FUNCTION update_recurring_series_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_recurring_series_timestamp ON recurring_booking_series;
CREATE TRIGGER update_recurring_series_timestamp
  BEFORE UPDATE ON recurring_booking_series
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_series_updated_at();

-- Enable RLS
ALTER TABLE recurring_booking_series ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_booking_series
CREATE POLICY "Users can view own recurring series"
  ON recurring_booking_series FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    provider_id = auth.uid()
  );

CREATE POLICY "Users can create own recurring series"
  ON recurring_booking_series FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own recurring series"
  ON recurring_booking_series FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own recurring series"
  ON recurring_booking_series FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_series_owner ON recurring_booking_series(owner_id);
CREATE INDEX IF NOT EXISTS idx_recurring_series_provider ON recurring_booking_series(provider_id);
CREATE INDEX IF NOT EXISTS idx_recurring_series_active ON recurring_booking_series(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bookings_recurring_series ON bookings(recurring_series_id);
CREATE INDEX IF NOT EXISTS idx_bookings_is_recurring ON bookings(is_recurring) WHERE is_recurring = true;
