/*
  # Create Notification Preferences System

  1. New Tables
    - `user_notification_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `email_notifications_enabled` (boolean, default true)
      - `push_notifications_enabled` (boolean, default false)
      - `sms_notifications_enabled` (boolean, default false)
      - `push_endpoint` (text, nullable)
      - `push_p256dh` (text, nullable)
      - `push_auth` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. RPC Functions
    - `get_notification_preferences()` - returns user's notification settings
    - `set_notification_preferences()` - upserts notification settings

  3. Security
    - Enable RLS on `user_notification_settings` table
    - Add policies for authenticated users to manage their own settings
*/

-- Create user notification settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications_enabled boolean NOT NULL DEFAULT true,
  push_notifications_enabled boolean NOT NULL DEFAULT false,
  sms_notifications_enabled boolean NOT NULL DEFAULT false,
  push_endpoint text,
  push_p256dh text,
  push_auth text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own notification settings"
  ON user_notification_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
  ON user_notification_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
  ON user_notification_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_settings_updated_at();

-- RPC function to get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences()
RETURNS TABLE (
  email_notifications_enabled boolean,
  push_notifications_enabled boolean,
  sms_notifications_enabled boolean,
  push_endpoint text,
  push_p256dh text,
  push_auth text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uns.email_notifications_enabled,
    uns.push_notifications_enabled,
    uns.sms_notifications_enabled,
    uns.push_endpoint,
    uns.push_p256dh,
    uns.push_auth
  FROM user_notification_settings uns
  WHERE uns.user_id = auth.uid();
  
  -- If no row found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      true::boolean as email_notifications_enabled,
      false::boolean as push_notifications_enabled,
      false::boolean as sms_notifications_enabled,
      null::text as push_endpoint,
      null::text as push_p256dh,
      null::text as push_auth;
  END IF;
END;
$$;

-- RPC function to set notification preferences
CREATE OR REPLACE FUNCTION set_notification_preferences(
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT false,
  sms_enabled boolean DEFAULT false,
  push_endpoint text DEFAULT null,
  push_p256dh text DEFAULT null,
  push_auth text DEFAULT null
)
RETURNS TABLE (
  email_notifications_enabled boolean,
  push_notifications_enabled boolean,
  sms_notifications_enabled boolean,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Upsert notification settings
  INSERT INTO user_notification_settings (
    user_id,
    email_notifications_enabled,
    push_notifications_enabled,
    sms_notifications_enabled,
    push_endpoint,
    push_p256dh,
    push_auth,
    updated_at
  ) VALUES (
    current_user_id,
    email_enabled,
    push_enabled,
    sms_enabled,
    push_endpoint,
    push_p256dh,
    push_auth,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    email_notifications_enabled = EXCLUDED.email_notifications_enabled,
    push_notifications_enabled = EXCLUDED.push_notifications_enabled,
    sms_notifications_enabled = EXCLUDED.sms_notifications_enabled,
    push_endpoint = EXCLUDED.push_endpoint,
    push_p256dh = EXCLUDED.push_p256dh,
    push_auth = EXCLUDED.push_auth,
    updated_at = now();

  -- Return updated values
  RETURN QUERY
  SELECT 
    email_enabled as email_notifications_enabled,
    push_enabled as push_notifications_enabled,
    sms_enabled as sms_notifications_enabled,
    true as success;
END;
$$;