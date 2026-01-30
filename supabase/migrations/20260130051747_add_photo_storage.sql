/*
  # Add Photo Storage for Pet Services

  ## Overview
  Creates storage bucket for pet photos during services with proper security policies.
  
  ## Storage Setup
  
  ### Bucket: `pet-service-photos`
  - Public access for reading (so photos can be displayed in chat)
  - Authenticated users can upload photos
  - Only booking participants can upload photos to their bookings
  - File size limit: 5MB
  - Allowed formats: jpg, jpeg, png, webp
  
  ## Security Policies
  
  1. **Public Read Access**
     - Anyone can view photos (necessary for sharing)
     - Photos are identified by booking ID in path structure
  
  2. **Upload Restrictions**
     - Only authenticated users can upload
     - Users can only upload to bookings they participate in
     - File naming convention: bookings/{booking_id}/{timestamp}-{random}.{ext}
  
  3. **Delete Restrictions**
     - Only the uploader can delete their own photos
     - Booking owners can delete photos from their bookings
  
  ## Path Structure
  - bookings/{booking_id}/{filename}
  
  ## Notes
  - Photos are automatically linked via chat messages (image_url field)
  - Storage bucket is separate from database for performance
  - Public bucket allows easy sharing without auth tokens
*/

-- Create storage bucket for pet service photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-service-photos',
  'pet-service-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view photos (public bucket)
CREATE POLICY "Public photos are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pet-service-photos');

-- Policy: Authenticated users can upload photos to their bookings
CREATE POLICY "Users can upload photos to their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-service-photos'
  AND (storage.foldername(name))[1] = 'bookings'
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id::text = (storage.foldername(name))[2]
    AND (
      bookings.owner_id = auth.uid()
      OR bookings.pet_master_id = auth.uid()
    )
  )
);

-- Policy: Users can delete their own uploaded photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pet-service-photos'
  AND owner = auth.uid()
);

-- Policy: Booking owners can delete photos from their bookings
CREATE POLICY "Booking owners can delete booking photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pet-service-photos'
  AND (storage.foldername(name))[1] = 'bookings'
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id::text = (storage.foldername(name))[2]
    AND bookings.owner_id = auth.uid()
  )
);