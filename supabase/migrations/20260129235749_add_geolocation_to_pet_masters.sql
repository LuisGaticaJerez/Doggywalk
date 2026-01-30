/*
  # Add Geolocation to Pet Masters

  1. Changes
    - Add `latitude` (decimal) - Geographic latitude coordinate
    - Add `longitude` (decimal) - Geographic longitude coordinate
    - Add `address` (text) - Full address for display
    - Add `city` (text) - City name for filtering
    - Add `country` (text) - Country name
    - Add index on latitude and longitude for efficient spatial queries

  2. Notes
    - Coordinates use standard WGS84 format (same as GPS)
    - Latitude range: -90 to 90
    - Longitude range: -180 to 180
    - Index helps with distance-based queries
*/

-- Add geolocation columns to pet_masters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN longitude DECIMAL(11, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'address'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'city'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'country'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN country TEXT DEFAULT 'Colombia';
  END IF;
END $$;

-- Create index for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_pet_masters_location 
ON pet_masters(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create a function to calculate distance between two points (in kilometers)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371; -- Earth radius in kilometers
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
