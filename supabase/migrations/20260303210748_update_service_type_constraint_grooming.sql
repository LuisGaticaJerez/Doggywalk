/*
  # Update service_type constraint to include grooming

  1. Changes
    - Drop existing service_type check constraint on pet_masters table
    - Add new constraint that includes 'grooming' type
    
  2. Security
    - No RLS changes needed
*/

-- Drop the old constraint
ALTER TABLE pet_masters 
DROP CONSTRAINT IF EXISTS pet_masters_service_type_check;

-- Add new constraint with grooming included
ALTER TABLE pet_masters 
ADD CONSTRAINT pet_masters_service_type_check 
CHECK (service_type = ANY (ARRAY['walker'::text, 'hotel'::text, 'vet'::text, 'grooming'::text]));
