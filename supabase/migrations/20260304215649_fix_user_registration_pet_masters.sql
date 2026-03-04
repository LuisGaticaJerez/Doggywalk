/*
  # Fix user registration to create pet_masters record

  1. Changes
    - Update handle_new_user() function to also create record in pet_masters
    - This ensures all users (both owners and providers) have a record in pet_masters
    - Uses Talcahuano coordinates as default location
  
  2. Security
    - Function runs with SECURITY DEFINER
    - Only creates records if they don't already exist
*/

-- Update function to handle new user creation in both tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create pet_masters record with default Talcahuano location
  INSERT INTO public.pet_masters (
    id, 
    latitude, 
    longitude, 
    address, 
    city, 
    country, 
    is_available,
    account_type
  )
  VALUES (
    NEW.id,
    -36.7225,
    -73.1136,
    'Talcahuano',
    'Talcahuano',
    'Chile',
    false,
    'individual'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
