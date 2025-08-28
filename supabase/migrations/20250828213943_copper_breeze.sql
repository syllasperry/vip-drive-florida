/*
  # Fix user_notification_prefs table schema

  1. Schema Updates
    - Add missing `email` column to `user_notification_prefs` table
    - Add missing `sms` column to `user_notification_prefs` table
    - Update existing records to have default values

  2. Data Migration
    - Set default values for existing records
    - Ensure all users have proper notification preferences
*/

-- Add missing columns to user_notification_prefs table
DO $$
BEGIN
  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_notification_prefs' AND column_name = 'email_enabled'
  ) THEN
    ALTER TABLE user_notification_prefs RENAME COLUMN email_enabled TO email_enabled_old;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_notification_prefs' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_notification_prefs ADD COLUMN email boolean DEFAULT true NOT NULL;
  END IF;

  -- Add sms column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_notification_prefs' AND column_name = 'sms'
  ) THEN
    ALTER TABLE user_notification_prefs ADD COLUMN sms boolean DEFAULT false NOT NULL;
  END IF;

  -- Migrate data from old column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_notification_prefs' AND column_name = 'email_enabled_old'
  ) THEN
    UPDATE user_notification_prefs SET email = email_enabled_old WHERE email_enabled_old IS NOT NULL;
    ALTER TABLE user_notification_prefs DROP COLUMN email_enabled_old;
  END IF;
END $$;