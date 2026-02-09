/*
  # Push Notifications, Cancellation Policies, Support System & Admin Dashboard

  ## 1. New Tables

  ### push_notification_tokens
  - `id` (uuid, primary key)
  - `pet_master_id` (uuid, references pet_masters)
  - `token` (text, unique) - FCM/APNS token
  - `platform` (text) - 'web', 'ios', 'android'
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### support_tickets
  - `id` (uuid, primary key)
  - `ticket_number` (text, unique) - e.g., "TICKET-001234"
  - `pet_master_id` (uuid, references pet_masters)
  - `booking_id` (uuid, references bookings, optional)
  - `subject` (text)
  - `category` (text) - 'booking_issue', 'payment', 'provider_complaint', 'technical', 'other'
  - `priority` (text) - 'low', 'medium', 'high', 'urgent'
  - `status` (text) - 'open', 'in_progress', 'waiting_response', 'resolved', 'closed'
  - `description` (text)
  - `assigned_to` (uuid, references pet_masters, nullable) - Admin assigned
  - `resolved_at` (timestamptz, nullable)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### ticket_messages
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, references support_tickets)
  - `sender_id` (uuid, references pet_masters)
  - `message` (text)
  - `is_internal` (boolean) - Internal admin notes
  - `created_at` (timestamptz)

  ### cancellation_policies
  - `id` (uuid, primary key)
  - `name` (text)
  - `hours_before` (integer) - Hours before booking to get refund
  - `refund_percentage` (integer) - 0-100
  - `description` (text)
  - `created_at` (timestamptz)

  ## 2. Modified Tables

  ### bookings
  - Add `cancellation_policy_id` (uuid, references cancellation_policies)
  - Add `cancelled_at` (timestamptz, nullable)
  - Add `cancellation_reason` (text, nullable)
  - Add `refund_amount` (decimal, nullable)
  - Add `refund_status` (text, nullable) - 'pending', 'processed', 'denied'

  ### pet_masters
  - Add `is_admin` (boolean, default false)
  - Add `admin_permissions` (jsonb, nullable) - Permissions object

  ## 3. Security
  - Enable RLS on all new tables
  - Add policies for authenticated users to manage their own data
  - Add policies for admins to access all data
  - Users can only see their own tickets
  - Admins can see and manage all tickets

  ## 4. Important Notes
  - Default cancellation policies inserted for common scenarios
  - Ticket numbers are auto-generated with sequence
  - Push tokens are unique per device
  - Support system with priority and assignment tracking
*/

-- Create push notification tokens table
CREATE TABLE IF NOT EXISTS push_notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_master_id uuid REFERENCES pet_masters(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cancellation policies table
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  hours_before integer NOT NULL,
  refund_percentage integer NOT NULL CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  pet_master_id uuid REFERENCES pet_masters(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('booking_issue', 'payment', 'provider_complaint', 'technical', 'other')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  description text NOT NULL,
  assigned_to uuid REFERENCES pet_masters(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES pet_masters(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add columns to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_policy_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_policy_id uuid REFERENCES cancellation_policies(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancellation_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'refund_amount'
  ) THEN
    ALTER TABLE bookings ADD COLUMN refund_amount decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'refund_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN refund_status text CHECK (refund_status IN ('pending', 'processed', 'denied'));
  END IF;
END $$;

-- Add admin columns to pet_masters
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pet_masters' AND column_name = 'admin_permissions'
  ) THEN
    ALTER TABLE pet_masters ADD COLUMN admin_permissions jsonb;
  END IF;
END $$;

-- Insert default cancellation policies
INSERT INTO cancellation_policies (name, hours_before, refund_percentage, description)
VALUES
  ('Flexible', 24, 100, 'Full refund if cancelled 24 hours before the booking'),
  ('Moderate', 48, 50, '50% refund if cancelled 48 hours before, no refund after'),
  ('Strict', 72, 0, 'No refund. Cancellations must be made 72 hours in advance for schedule adjustment'),
  ('Same Day', 2, 0, 'No refund for same-day cancellations. 2-hour notice required')
ON CONFLICT DO NOTHING;

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
BEGIN
  RETURN 'TICKET-' || LPAD(nextval('ticket_number_seq')::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_number_trigger ON support_tickets;
CREATE TRIGGER set_ticket_number_trigger
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_notification_tokens;
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON push_notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE push_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_notification_tokens
CREATE POLICY "Users can view own push tokens"
  ON push_notification_tokens FOR SELECT
  TO authenticated
  USING (pet_master_id = auth.uid());

CREATE POLICY "Users can insert own push tokens"
  ON push_notification_tokens FOR INSERT
  TO authenticated
  WITH CHECK (pet_master_id = auth.uid());

CREATE POLICY "Users can update own push tokens"
  ON push_notification_tokens FOR UPDATE
  TO authenticated
  USING (pet_master_id = auth.uid())
  WITH CHECK (pet_master_id = auth.uid());

CREATE POLICY "Users can delete own push tokens"
  ON push_notification_tokens FOR DELETE
  TO authenticated
  USING (pet_master_id = auth.uid());

-- RLS Policies for cancellation_policies (read-only for all users)
CREATE POLICY "Anyone can view cancellation policies"
  ON cancellation_policies FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    pet_master_id = auth.uid() OR
    EXISTS (SELECT 1 FROM pet_masters WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can create own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (pet_master_id = auth.uid());

CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    pet_master_id = auth.uid() OR
    EXISTS (SELECT 1 FROM pet_masters WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    pet_master_id = auth.uid() OR
    EXISTS (SELECT 1 FROM pet_masters WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND (
        pet_master_id = auth.uid() OR
        EXISTS (SELECT 1 FROM pet_masters WHERE id = auth.uid() AND is_admin = true)
      )
    )
    AND (
      NOT is_internal OR
      EXISTS (SELECT 1 FROM pet_masters WHERE id = auth.uid() AND is_admin = true)
    )
  );

CREATE POLICY "Users can create ticket messages"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = ticket_id
      AND (
        pet_master_id = auth.uid() OR
        EXISTS (SELECT 1 FROM pet_masters WHERE id = auth.uid() AND is_admin = true)
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_pet_master ON push_notification_tokens(pet_master_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_notification_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_support_tickets_pet_master ON support_tickets(pet_master_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_policy ON bookings(cancellation_policy_id);