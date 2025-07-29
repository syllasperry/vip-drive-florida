-- Add payment method and cancellation policy fields to drivers table
ALTER TABLE drivers 
ADD COLUMN payment_methods_accepted TEXT[],
ADD COLUMN cancellation_policy TEXT;

-- Update booking status constraint to include all new statuses
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN (
  'pending', 
  'accepted', 
  'declined', 
  'price_proposed', 
  'payment_confirmed', 
  'payment_pending', 
  'ready_to_go',
  'in_progress', 
  'completed', 
  'canceled',
  'awaiting_driver_confirmation',
  'rejected_by_passenger'
));

-- Update payment status constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN (
  'pending', 
  'pending_payment', 
  'passenger_confirmed', 
  'driver_confirmed', 
  'both_confirmed',
  'paid', 
  'failed', 
  'refunded'
));

-- Add notification preferences table for sound/notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('passenger', 'driver')),
  sound_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON notification_preferences 
FOR ALL 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add unread message count tracking
CREATE TABLE IF NOT EXISTS message_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, user_id)
);

-- Enable RLS on message status
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- Create policy for message status
CREATE POLICY "Users can manage their message status" 
ON message_status 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_message_status_updated_at
BEFORE UPDATE ON message_status
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();