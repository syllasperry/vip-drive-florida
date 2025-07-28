-- Create messages table for real-time chat between passengers and drivers
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('passenger', 'driver')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages for their bookings" 
ON public.messages 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM bookings 
    WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages for their bookings" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM bookings 
    WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
  )
  AND auth.uid() = sender_id
);

-- Create function to update timestamps
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.messages;