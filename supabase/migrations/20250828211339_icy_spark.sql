/*
  # Create user push devices table

  1. New Tables
    - `user_push_devices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `device_token` (text, unique)
      - `platform` (text, ios/android/web)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_push_devices` table
    - Add policies for users to manage their own devices
*/

CREATE TABLE IF NOT EXISTS user_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push devices"
  ON user_push_devices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push devices"
  ON user_push_devices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push devices"
  ON user_push_devices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push devices"
  ON user_push_devices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_devices_updated_at
  BEFORE UPDATE ON user_push_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_push_devices_updated_at();