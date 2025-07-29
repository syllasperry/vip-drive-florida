-- Add new columns to drivers table for payment methods and cancellation policy
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS payment_methods_accepted TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS preferred_payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Add detailed payment method columns
ALTER TABLE public.drivers 
ADD COLUMN IF NOT EXISTS payment_methods_credit_cards TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS payment_methods_digital TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS zelle_info TEXT,
ADD COLUMN IF NOT EXISTS venmo_info TEXT,
ADD COLUMN IF NOT EXISTS apple_pay_info TEXT,
ADD COLUMN IF NOT EXISTS google_pay_info TEXT,
ADD COLUMN IF NOT EXISTS payment_link_info TEXT;

-- Add new status values to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'passenger')),
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  sound_enabled BOOLEAN DEFAULT false,
  booking_updates_enabled BOOLEAN DEFAULT true,
  driver_messages_enabled BOOLEAN DEFAULT true,
  promotions_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for notification preferences
CREATE POLICY "Users can manage their own notification preferences"
ON public.notification_preferences
FOR ALL
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Create message_status table for chat notifications
CREATE TABLE IF NOT EXISTS public.message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on message_status
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

-- Create policy for message_status
CREATE POLICY "Users can manage their message status"
ON public.message_status
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_status_updated_at
  BEFORE UPDATE ON message_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();