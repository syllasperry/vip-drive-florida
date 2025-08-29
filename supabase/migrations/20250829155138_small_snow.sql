/*
  # Create user push devices table for storing device tokens

  1. New Tables
    - `user_push_devices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `device_token` (text, unique device identifier)
      - `platform` (text, device platform)
      - `endpoint` (text, push endpoint URL)
      - `user_agent` (text, browser info)
      - `is_active` (boolean, default true)
      - `last_used_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_push_devices` table
    - Add policy for users to manage their own devices
*/

CREATE TABLE IF NOT EXISTS user_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  endpoint text,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_token)
);

ALTER TABLE user_push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push devices"
  ON user_push_devices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_user_push_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_user_push_devices_updated_at
  BEFORE UPDATE ON user_push_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_push_devices_updated_at();