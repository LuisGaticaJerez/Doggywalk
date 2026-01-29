/*
  # Add language preference to profiles

  1. Changes
    - Add `language` column to profiles table
    - Default language is 'en' (English)
    - Supported languages: en, es, zh, hi, ar, pt, fr, de, ja, ru
  
  2. Notes
    - Users can change their preferred language in settings
    - Language preference is stored per user
*/

-- Add language column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN language text DEFAULT 'en' NOT NULL;
  END IF;
END $$;

-- Add check constraint for supported languages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'profiles_language_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_language_check 
    CHECK (language IN ('en', 'es', 'zh', 'hi', 'ar', 'pt', 'fr', 'de', 'ja', 'ru'));
  END IF;
END $$;
