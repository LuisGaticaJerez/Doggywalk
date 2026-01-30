/*
  # Add account type to pet masters

  1. Changes
    - Add `account_type` column to pet_masters table
    - This allows providers to specify if they are an individual or a company
    - Default value is 'individual'
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add account_type column to pet_masters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE pet_masters 
    ADD COLUMN account_type text DEFAULT 'individual' CHECK (account_type IN ('individual', 'company'));
  END IF;
END $$;