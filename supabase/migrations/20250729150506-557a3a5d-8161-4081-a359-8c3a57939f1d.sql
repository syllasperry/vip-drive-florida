-- Update notification_preferences table to add specific notification type columns
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS booking_updates_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS driver_messages_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS promotions_enabled boolean DEFAULT false;

-- Update drivers table to add detailed payment methods and instructions
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS payment_methods_credit_cards text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_methods_digital text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS zelle_info text,
ADD COLUMN IF NOT EXISTS venmo_info text,
ADD COLUMN IF NOT EXISTS apple_pay_info text,
ADD COLUMN IF NOT EXISTS google_pay_info text,
ADD COLUMN IF NOT EXISTS payment_link_info text;