/*
  # Set Default Onboarding Values

  1. Changes
    - Set onboarding_completed to true for existing profiles (backward compatibility)
    - Set business_type to 'individual' for existing profiles
    - New profiles will get the correct default values (false for onboarding_completed)
  
  2. Notes
    - Existing users are considered already onboarded
    - New pet_master registrations will need to complete onboarding
*/

-- Update existing profiles to have onboarding_completed = true (backward compatibility)
UPDATE profiles 
SET 
  onboarding_completed = COALESCE(onboarding_completed, true),
  business_type = COALESCE(business_type, 'individual')
WHERE onboarding_completed IS NULL OR business_type IS NULL;

-- Now update the default for NEW profiles to require onboarding
ALTER TABLE profiles 
  ALTER COLUMN onboarding_completed SET DEFAULT false,
  ALTER COLUMN business_type SET DEFAULT 'individual';

-- Make columns NOT NULL now that all existing rows have values
ALTER TABLE profiles 
  ALTER COLUMN onboarding_completed SET NOT NULL,
  ALTER COLUMN business_type SET NOT NULL;
