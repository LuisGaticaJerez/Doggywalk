/*
  # Favorite Providers and Advanced Features

  1. Purpose
    - Allow users to save favorite providers for quick access
    - Track provider view counts for popularity metrics
    - Support advanced search filtering

  2. New Tables
    - `favorite_providers`: User's saved favorite providers
    - `provider_views`: Track provider profile views

  3. New Columns
    - `pet_masters`: Add view_count, rating_count, total_rating_sum
    - `bookings`: Add is_favorite (to mark favorite bookings)

  4. Security
    - Enable RLS on all new tables
    - Users can only manage their own favorites
    - View counts are publicly readable

  5. Functions
    - Increment view count when profile is viewed
    - Calculate average rating from reviews
*/

-- Favorite providers table
CREATE TABLE IF NOT EXISTS favorite_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(user_id, provider_id)
);

-- Provider views tracking
CREATE TABLE IF NOT EXISTS provider_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES pet_masters(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now(),
  session_id text
);

-- Add analytics columns to pet_masters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'favorite_count'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN favorite_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'search_tags'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN search_tags text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'accepts_emergency'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN accepts_emergency boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN years_experience integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'insurance_verified'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN insurance_verified boolean DEFAULT false;
  END IF;
END $$;

-- Add favorite flag to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE bookings ADD COLUMN is_favorite boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorite_providers_user 
  ON favorite_providers(user_id);

CREATE INDEX IF NOT EXISTS idx_favorite_providers_provider 
  ON favorite_providers(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_views_provider 
  ON provider_views(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_views_date 
  ON provider_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_pet_masters_search_tags 
  ON pet_masters USING GIN(search_tags);

-- Enable RLS
ALTER TABLE favorite_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_providers

CREATE POLICY "Users can view own favorites"
  ON favorite_providers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON favorite_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own favorites"
  ON favorite_providers
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own favorite notes"
  ON favorite_providers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for provider_views

CREATE POLICY "Anyone can view provider views"
  ON provider_views
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can log views"
  ON provider_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_provider_view_count(
  p_provider_id uuid,
  p_viewer_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO provider_views (provider_id, viewer_id, session_id)
  VALUES (p_provider_id, p_viewer_id, p_session_id);
  
  UPDATE pet_masters
  SET view_count = view_count + 1
  WHERE id = p_provider_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update favorite count when favorite is added/removed
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE pet_masters
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.provider_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE pet_masters
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = OLD.provider_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorite count
DROP TRIGGER IF EXISTS trigger_update_favorite_count ON favorite_providers;
CREATE TRIGGER trigger_update_favorite_count
  AFTER INSERT OR DELETE ON favorite_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_count();

-- Function to get trending providers (most viewed in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_providers(
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  provider_id uuid,
  view_count_7d bigint,
  favorite_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pv.provider_id,
    COUNT(*)::bigint as view_count_7d,
    pm.favorite_count
  FROM provider_views pv
  JOIN pet_masters pm ON pm.id = pv.provider_id
  WHERE pv.viewed_at >= NOW() - INTERVAL '7 days'
    AND pm.account_type = 'pet_master'
    AND pm.onboarding_completed = true
  GROUP BY pv.provider_id, pm.favorite_count
  ORDER BY view_count_7d DESC, pm.favorite_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for advanced search with filters
CREATE OR REPLACE FUNCTION search_providers_advanced(
  p_service_type text DEFAULT NULL,
  p_min_rating numeric DEFAULT 0,
  p_max_price numeric DEFAULT NULL,
  p_accepts_emergency boolean DEFAULT NULL,
  p_min_experience integer DEFAULT NULL,
  p_insurance_verified boolean DEFAULT NULL,
  p_search_tags text[] DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE(
  id uuid,
  full_name text,
  service_type text,
  hourly_rate numeric,
  rating numeric,
  years_experience integer,
  accepts_emergency boolean,
  insurance_verified boolean,
  view_count integer,
  favorite_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.full_name,
    pm.service_type,
    pm.hourly_rate,
    COALESCE(
      (SELECT AVG(rating)::numeric(3,2) FROM reviews WHERE pet_master_id = pm.id),
      0
    ) as rating,
    pm.years_experience,
    pm.accepts_emergency,
    pm.insurance_verified,
    pm.view_count,
    pm.favorite_count
  FROM pet_masters pm
  WHERE pm.account_type = 'pet_master'
    AND pm.onboarding_completed = true
    AND (p_service_type IS NULL OR pm.service_type = p_service_type)
    AND (p_max_price IS NULL OR pm.hourly_rate <= p_max_price)
    AND (p_accepts_emergency IS NULL OR pm.accepts_emergency = p_accepts_emergency)
    AND (p_min_experience IS NULL OR pm.years_experience >= p_min_experience)
    AND (p_insurance_verified IS NULL OR pm.insurance_verified = p_insurance_verified)
    AND (p_search_tags IS NULL OR pm.search_tags && p_search_tags)
    AND COALESCE(
      (SELECT AVG(rating) FROM reviews WHERE pet_master_id = pm.id),
      0
    ) >= p_min_rating
  ORDER BY 
    rating DESC,
    pm.favorite_count DESC,
    pm.view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;