-- Complete Identity Verification System Setup
--
-- This migration completes the identity verification system by adding:
-- - Storage buckets for identity documents and selfies
-- - Storage policies for secure file access
-- - Trigger function to sync verification status with profile
-- - Trigger to automatically update profile when verification is approved

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('identity-documents', 'identity-documents', false),
       ('identity-selfies', 'identity-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for identity-documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own identity documents'
  ) THEN
    CREATE POLICY "Users can upload own identity documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'identity-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own identity documents'
  ) THEN
    CREATE POLICY "Users can view own identity documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'identity-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own identity documents'
  ) THEN
    CREATE POLICY "Users can update own identity documents"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'identity-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own identity documents'
  ) THEN
    CREATE POLICY "Users can delete own identity documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'identity-documents' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Storage policies for identity-selfies bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own selfies'
  ) THEN
    CREATE POLICY "Users can upload own selfies"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'identity-selfies' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own selfies'
  ) THEN
    CREATE POLICY "Users can view own selfies"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'identity-selfies' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own selfies'
  ) THEN
    CREATE POLICY "Users can update own selfies"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'identity-selfies' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own selfies'
  ) THEN
    CREATE POLICY "Users can delete own selfies"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'identity-selfies' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Function to automatically update profile when verification is approved
CREATE OR REPLACE FUNCTION update_profile_on_verification_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE profiles
    SET identity_verified = true
    WHERE id = NEW.provider_id;
  ELSIF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE profiles
    SET identity_verified = false
    WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync identity_verified status
DROP TRIGGER IF EXISTS sync_identity_verified_status ON identity_verifications;
CREATE TRIGGER sync_identity_verified_status
  AFTER UPDATE ON identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_on_verification_approval();
