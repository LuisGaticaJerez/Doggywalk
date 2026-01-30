/*
  # Multi-Service Provider Support

  1. New Tables
    - `provider_services`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, references profiles)
      - `service_type` (text: walker, hotel, vet)
      - `is_active` (boolean)
      - `hourly_rate` (numeric)
      - `price_per_night` (numeric)
      - `service_radius` (integer)
      - `capacity` (integer)
      - `specialties` (text[])
      - `facilities` (text[])
      - `emergency_service` (boolean)
      - `address` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `city` (text)
      - `country` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `business_verifications`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, references profiles)
      - `business_name` (text)
      - `business_tax_id` (text)
      - `business_license_url` (text)
      - `business_proof_url` (text)
      - `ownership_proof_url` (text)
      - `status` (text: pending, under_review, approved, rejected)
      - `rejection_reason` (text)
      - `submitted_at` (timestamp)
      - `reviewed_at` (timestamp)
      - `reviewed_by` (uuid)
      - `created_at` (timestamp)

  2. Changes
    - Add `onboarding_completed` to profiles
    - Add `business_type` to profiles (individual, business)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Add new fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'individual' CHECK (business_type IN ('individual', 'business'));

-- Create provider_services table
CREATE TABLE IF NOT EXISTS provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('walker', 'hotel', 'vet')),
  is_active boolean DEFAULT true,
  hourly_rate numeric DEFAULT 15.00,
  price_per_night numeric,
  service_radius integer DEFAULT 5000,
  capacity integer DEFAULT 0,
  specialties text[] DEFAULT '{}',
  facilities text[] DEFAULT '{}',
  emergency_service boolean DEFAULT false,
  address text,
  latitude numeric,
  longitude numeric,
  city text,
  country text DEFAULT 'Colombia',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business_verifications table
CREATE TABLE IF NOT EXISTS business_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_tax_id text NOT NULL,
  business_license_url text,
  business_proof_url text,
  ownership_proof_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for provider_services
CREATE POLICY "Users can view all active provider services"
  ON provider_services FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Providers can view own services"
  ON provider_services FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own services"
  ON provider_services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own services"
  ON provider_services FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can delete own services"
  ON provider_services FOR DELETE
  TO authenticated
  USING (auth.uid() = provider_id);

-- Policies for business_verifications
CREATE POLICY "Users can view own business verifications"
  ON business_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = provider_id);

CREATE POLICY "Users can insert own business verifications"
  ON business_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update own business verifications"
  ON business_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id AND status = 'pending')
  WITH CHECK (auth.uid() = provider_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_provider_services_provider_id ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_service_type ON provider_services(service_type);
CREATE INDEX IF NOT EXISTS idx_provider_services_location ON provider_services(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_business_verifications_provider_id ON business_verifications(provider_id);
CREATE INDEX IF NOT EXISTS idx_business_verifications_status ON business_verifications(status);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_provider_services_updated_at ON provider_services;
CREATE TRIGGER update_provider_services_updated_at
  BEFORE UPDATE ON provider_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_verifications_updated_at ON business_verifications;
CREATE TRIGGER update_business_verifications_updated_at
  BEFORE UPDATE ON business_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
