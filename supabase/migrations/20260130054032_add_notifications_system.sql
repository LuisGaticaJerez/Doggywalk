/*
  # Add Real-Time Notifications System

  ## Overview
  Creates a comprehensive notification system for real-time user updates about important events.
  
  ## New Tables
  
  ### `notifications`
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - User receiving the notification
  - `type` (text) - Type of notification (booking_request, booking_accepted, etc.)
  - `title` (text) - Short notification title
  - `message` (text) - Detailed notification message
  - `related_id` (uuid, nullable) - ID of related entity (booking, review, etc.)
  - `related_type` (text, nullable) - Type of related entity (booking, review, message)
  - `read` (boolean) - Whether notification has been read
  - `action_url` (text, nullable) - Optional URL to navigate to
  - `created_at` (timestamptz) - When notification was created
  
  ## Notification Types
  
  1. **booking_request** - New booking received (for providers)
  2. **booking_accepted** - Booking was accepted (for owners)
  3. **booking_started** - Service started (for owners)
  4. **booking_completed** - Service completed (for both)
  5. **booking_cancelled** - Booking cancelled (for both)
  6. **new_message** - New chat message received
  7. **new_review** - New review received (for providers)
  8. **review_reminder** - Reminder to leave a review (for owners)
  
  ## Security (RLS)
  
  1. **Read Policy**
     - Users can only read their own notifications
  
  2. **Create Policy**
     - Only authenticated users (typically via triggers)
  
  3. **Update Policy**
     - Users can only update their own notifications
     - Typically just marking as read
  
  4. **Delete Policy**
     - Users can delete their own notifications
  
  ## Indexes
  - Index on user_id for fast user-specific queries
  - Index on created_at for sorting
  - Index on read status for filtering unread
  - Composite index on (user_id, read, created_at) for optimal queries
  
  ## Real-time
  - Enabled for real-time subscriptions
  - Users can subscribe to their own notification channel
  
  ## Notes
  - Notifications older than 30 days can be auto-archived
  - Push to mobile devices can be added later via Edge Functions
  - Email notifications can be triggered for important events
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (
    type IN (
      'booking_request',
      'booking_accepted',
      'booking_started',
      'booking_completed',
      'booking_cancelled',
      'new_message',
      'new_review',
      'review_reminder',
      'system_announcement'
    )
  ),
  title text NOT NULL,
  message text NOT NULL,
  related_id uuid,
  related_type text CHECK (
    related_type IS NULL OR 
    related_type IN ('booking', 'review', 'message', 'user')
  ),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_composite ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_id, related_type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: System can create notifications (via triggers/functions)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid DEFAULT NULL,
  p_related_type text DEFAULT NULL,
  p_action_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_id,
    p_related_type,
    p_action_url
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = notification_id
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = auth.uid()
  AND read = false;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new booking notifications
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_name text;
  v_pet_name text;
BEGIN
  -- Get owner and pet info
  SELECT p.full_name INTO v_owner_name
  FROM profiles p
  WHERE p.id = NEW.owner_id;
  
  SELECT pt.name INTO v_pet_name
  FROM pets pt
  WHERE pt.id = NEW.pet_id;
  
  -- Notify provider about new booking request
  IF NEW.pet_master_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.pet_master_id,
      'booking_request',
      'New Booking Request',
      v_owner_name || ' has requested a service for ' || COALESCE(v_pet_name, 'their pet'),
      NEW.id,
      'booking',
      '/my-bookings'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_name text;
  v_pet_name text;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get provider and pet info
  SELECT p.full_name INTO v_provider_name
  FROM profiles p
  JOIN pet_masters pm ON pm.id = p.id
  WHERE pm.id = NEW.pet_master_id;
  
  SELECT pt.name INTO v_pet_name
  FROM pets pt
  WHERE pt.id = NEW.pet_id;
  
  -- Notify owner about status changes
  IF NEW.status = 'accepted' THEN
    PERFORM create_notification(
      NEW.owner_id,
      'booking_accepted',
      'Booking Accepted!',
      v_provider_name || ' has accepted your booking for ' || COALESCE(v_pet_name, 'your pet'),
      NEW.id,
      'booking',
      '/bookings'
    );
  ELSIF NEW.status = 'in_progress' THEN
    PERFORM create_notification(
      NEW.owner_id,
      'booking_started',
      'Service Started',
      'The service for ' || COALESCE(v_pet_name, 'your pet') || ' has started!',
      NEW.id,
      'booking',
      '/bookings/' || NEW.id || '/track'
    );
  ELSIF NEW.status = 'completed' THEN
    PERFORM create_notification(
      NEW.owner_id,
      'booking_completed',
      'Service Completed',
      'The service for ' || COALESCE(v_pet_name, 'your pet') || ' is complete. Leave a review!',
      NEW.id,
      'booking',
      '/bookings/' || NEW.id || '/rate'
    );
    
    -- Also notify provider
    PERFORM create_notification(
      NEW.pet_master_id,
      'booking_completed',
      'Service Completed',
      'Service for ' || COALESCE(v_pet_name, '') || ' has been completed',
      NEW.id,
      'booking',
      '/my-bookings'
    );
  ELSIF NEW.status = 'cancelled' THEN
    -- Notify both parties
    PERFORM create_notification(
      NEW.owner_id,
      'booking_cancelled',
      'Booking Cancelled',
      'Your booking has been cancelled',
      NEW.id,
      'booking',
      '/bookings'
    );
    
    IF NEW.pet_master_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.pet_master_id,
        'booking_cancelled',
        'Booking Cancelled',
        'A booking has been cancelled',
        NEW.id,
        'booking',
        '/my-bookings'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new reviews
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name text;
BEGIN
  -- Get reviewer info
  SELECT p.full_name INTO v_reviewer_name
  FROM profiles p
  WHERE p.id = NEW.owner_id;
  
  -- Notify provider about new review
  PERFORM create_notification(
    NEW.pet_master_id,
    'new_review',
    'New Review Received!',
    v_reviewer_name || ' left you a ' || NEW.rating || '-star review',
    NEW.id,
    'review',
    '/profile-setup'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new chat messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name text;
  v_recipient_id uuid;
  v_booking record;
BEGIN
  -- Get sender info
  SELECT p.full_name INTO v_sender_name
  FROM profiles p
  WHERE p.id = NEW.sender_id;
  
  -- Get booking info to determine recipient
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = NEW.booking_id;
  
  -- Determine recipient (the other party in the conversation)
  IF NEW.sender_id = v_booking.owner_id THEN
    v_recipient_id := v_booking.pet_master_id;
  ELSE
    v_recipient_id := v_booking.owner_id;
  END IF;
  
  -- Only notify if recipient exists
  IF v_recipient_id IS NOT NULL THEN
    PERFORM create_notification(
      v_recipient_id,
      'new_message',
      'New Message',
      v_sender_name || ' sent you a message',
      NEW.booking_id,
      'booking',
      '/bookings/' || NEW.booking_id || '/chat'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DO $$
BEGIN
  -- Trigger for new bookings
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_booking') THEN
    CREATE TRIGGER trigger_notify_new_booking
      AFTER INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_booking();
  END IF;
  
  -- Trigger for booking status changes
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_booking_status') THEN
    CREATE TRIGGER trigger_notify_booking_status
      AFTER UPDATE ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION notify_booking_status_change();
  END IF;
  
  -- Trigger for new reviews
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_review') THEN
    CREATE TRIGGER trigger_notify_new_review
      AFTER INSERT ON ratings
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_review();
  END IF;
  
  -- Trigger for new messages
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_message') THEN
    CREATE TRIGGER trigger_notify_new_message
      AFTER INSERT ON chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_message();
  END IF;
END $$;