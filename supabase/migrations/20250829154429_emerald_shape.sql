/*
  # Create user_push_devices table for storing push notification tokens

  1. Tables
    - `user_push_devices` table for storing device tokens
    - Support for multiple devices per user
    - Track device platform and registration status

  2. Security
    - Enable RLS on `user_push_devices` table
    - Add policies for users to manage their own devices
    - Ensure proper foreign key constraints
*/

-- Create user_push_devices table
CREATE TABLE IF NOT EXISTS user_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
  endpoint text,
  p256dh_key text,
  auth_key text,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Enable RLS
ALTER TABLE user_push_devices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own push devices"
  ON user_push_devices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_user_push_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_push_devices_updated_at_trigger
  BEFORE UPDATE ON user_push_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_push_devices_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_push_devices_user_id ON user_push_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_devices_active ON user_push_devices(user_id, is_active) WHERE is_active = true;