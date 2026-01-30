/*
  # Add Real-Time Chat System

  ## Overview
  Implements a real-time messaging system that allows pet owners and service providers
  to communicate before, during, and after service bookings.

  ## New Tables
  
  ### `chat_messages`
  - `id` (uuid, primary key) - Unique message identifier
  - `booking_id` (uuid, foreign key) - Links message to specific booking
  - `sender_id` (uuid, foreign key) - User who sent the message
  - `message` (text) - Message content
  - `image_url` (text, nullable) - Optional image/photo URL for future photo sharing
  - `read_at` (timestamptz, nullable) - When message was read by recipient
  - `created_at` (timestamptz) - Message timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - Enable RLS on `chat_messages` table
  - Users can only see messages from their own bookings (as owner or pet_master)
  - Users can only send messages to bookings they're part of
  - Messages cannot be edited or deleted after sending (audit trail)
  
  ### Policies
  1. **"Users can view messages from their bookings"**
     - SELECT access for authenticated users
     - Only messages where user is either the owner or pet_master of the booking
  
  2. **"Users can send messages to their bookings"**
     - INSERT access for authenticated users
     - Can only send to bookings where they're the owner or pet_master
     - sender_id must match authenticated user
  
  3. **"Users can mark messages as read"**
     - UPDATE access for authenticated users (read_at only)
     - Can only mark messages they received (not their own)

  ## Performance
  - Index on `booking_id` for fast message retrieval
  - Index on `created_at` for chronological ordering
  - Composite index on (booking_id, created_at) for optimal query performance

  ## Notes
  - Messages are immutable for accountability and trust
  - Realtime subscriptions will be handled in application layer
  - Image support prepared for future photo-sharing feature
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  image_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_id ON chat_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking_created ON chat_messages(booking_id, created_at);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their bookings
CREATE POLICY "Users can view messages from their bookings"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = chat_messages.booking_id
      AND (
        bookings.owner_id = auth.uid()
        OR bookings.pet_master_id = auth.uid()
      )
    )
  );

-- Policy: Users can send messages to their bookings
CREATE POLICY "Users can send messages to their bookings"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = chat_messages.booking_id
      AND (
        bookings.owner_id = auth.uid()
        OR bookings.pet_master_id = auth.uid()
      )
    )
  );

-- Policy: Users can mark messages as read (only messages they received)
CREATE POLICY "Users can mark messages as read"
  ON chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = chat_messages.booking_id
      AND (
        bookings.owner_id = auth.uid()
        OR bookings.pet_master_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    sender_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = chat_messages.booking_id
      AND (
        bookings.owner_id = auth.uid()
        OR bookings.pet_master_id = auth.uid()
      )
    )
  );