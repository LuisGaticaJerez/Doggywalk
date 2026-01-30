/*
  # Add Multi-Pet Booking Support

  1. Changes
    - Create `booking_pets` junction table to support multiple pets per booking
    - Add `pet_count` to bookings table for quick reference
    - Migrate existing single-pet bookings to new structure
    - Update RLS policies for new table
  
  2. New Tables
    - `booking_pets`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `pet_id` (uuid, references pets)
      - `created_at` (timestamp)
  
  3. Security
    - Enable RLS on `booking_pets` table
    - Add policy for owners to view their booking pets
    - Add policy for pet masters to view assigned booking pets
*/

-- Create booking_pets junction table
CREATE TABLE IF NOT EXISTS booking_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  pet_id uuid REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id, pet_id)
);

-- Add pet_count column to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'pet_count'
  ) THEN
    ALTER TABLE bookings ADD COLUMN pet_count integer DEFAULT 1;
  END IF;
END $$;

-- Migrate existing bookings to new structure
INSERT INTO booking_pets (booking_id, pet_id)
SELECT id, pet_id 
FROM bookings 
WHERE pet_id IS NOT NULL
ON CONFLICT (booking_id, pet_id) DO NOTHING;

-- Enable RLS
ALTER TABLE booking_pets ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can view their booking pets
CREATE POLICY "Owners can view their booking pets"
  ON booking_pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.owner_id = auth.uid()
    )
  );

-- Policy: Owners can insert booking pets for their bookings
CREATE POLICY "Owners can insert booking pets"
  ON booking_pets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.owner_id = auth.uid()
    )
  );

-- Policy: Pet masters can view their assigned booking pets
CREATE POLICY "Pet masters can view assigned booking pets"
  ON booking_pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.pet_master_id = auth.uid()
    )
  );

-- Policy: Owners can delete booking pets for pending bookings
CREATE POLICY "Owners can delete booking pets"
  ON booking_pets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_pets.booking_id
      AND bookings.owner_id = auth.uid()
      AND bookings.status = 'pending'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_pets_booking_id ON booking_pets(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_pets_pet_id ON booking_pets(pet_id);
