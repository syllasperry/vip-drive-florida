-- Add email_2fa_enabled column to notification_preferences table
ALTER TABLE public.notification_preferences 
ADD COLUMN email_2fa_enabled boolean DEFAULT false;