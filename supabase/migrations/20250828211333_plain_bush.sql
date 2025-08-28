/*
  # Create user notification preferences table

  1. New Tables
    - `user_notification_prefs`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `email` (boolean, default true)
      - `push` (boolean, default false)
      - `sms` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_notification_prefs` table
    - Add policies for users to manage their own preferences
*/

CREATE TABLE IF NOT EXISTS user_notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email boolean DEFAULT true NOT NULL,
  push boolean DEFAULT false NOT NULL,
  sms boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON user_notification_prefs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_prefs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_prefs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_prefs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON user_notification_prefs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_prefs_updated_at();