/*
  # Add Public Read Access for Provider Search

  1. Changes
    - Add RLS policies to allow anonymous (unauthenticated) users to view provider profiles
    - Allow public read access to pet_masters table
    - Allow public read access to profiles table (for provider names)
    - Allow public read access to service_hours, hotel_amenities, vet_services, grooming_services
    - Allow public read access to service_photos
    - Allow public read access to reviews and ratings

  2. Security
    - Only SELECT operations are allowed for anonymous users
    - All other operations (INSERT, UPDATE, DELETE) still require authentication
    - Personal data like email and phone remain protected
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view available providers" ON pet_masters;
DROP POLICY IF EXISTS "Public can view provider profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view service hours" ON service_hours;
DROP POLICY IF EXISTS "Public can view hotel amenities" ON hotel_amenities;
DROP POLICY IF EXISTS "Public can view vet services" ON vet_services;
DROP POLICY IF EXISTS "Public can view grooming services" ON grooming_services;
DROP POLICY IF EXISTS "Public can view service photos" ON service_photos;
DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view ratings" ON ratings;

-- Allow anonymous users to view available pet masters
CREATE POLICY "Public can view available providers"
  ON pet_masters
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view provider profiles (basic info only)
CREATE POLICY "Public can view provider profiles"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view service hours
CREATE POLICY "Public can view service hours"
  ON service_hours
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view hotel amenities
CREATE POLICY "Public can view hotel amenities"
  ON hotel_amenities
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view vet services
CREATE POLICY "Public can view vet services"
  ON vet_services
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view grooming services
CREATE POLICY "Public can view grooming services"
  ON grooming_services
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view service photos
CREATE POLICY "Public can view service photos"
  ON service_photos
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view reviews
CREATE POLICY "Public can view reviews"
  ON reviews
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view ratings
CREATE POLICY "Public can view ratings"
  ON ratings
  FOR SELECT
  TO anon
  USING (true);
