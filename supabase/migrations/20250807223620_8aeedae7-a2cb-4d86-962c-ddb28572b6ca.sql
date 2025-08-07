
-- First, let's create the proper driver_offers table
CREATE TABLE IF NOT EXISTS public.driver_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  offer_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for driver_offers
ALTER TABLE public.driver_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can create their own offers" ON public.driver_offers
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own offers" ON public.driver_offers
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Passengers can view offers for their bookings" ON public.driver_offers
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE passenger_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can update their own offers" ON public.driver_offers
  FOR UPDATE USING (auth.uid() = driver_id);

-- Standardize booking status fields by removing redundant ones and keeping essential ones
ALTER TABLE public.bookings 
  DROP COLUMN IF EXISTS driver_status,
  DROP COLUMN IF EXISTS passenger_status;

-- Add unified status field if it doesn't exist
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS unified_status TEXT DEFAULT 'pending';

-- Create a function to determine unified booking status
CREATE OR REPLACE FUNCTION public.get_unified_booking_status(booking_row public.bookings)
RETURNS TEXT AS $$
BEGIN
  -- All set - everything confirmed
  IF booking_row.payment_confirmation_status = 'all_set' THEN
    RETURN 'all_set';
  END IF;
  
  -- Payment confirmed by passenger, waiting for driver confirmation
  IF booking_row.payment_confirmation_status = 'passenger_paid' THEN
    RETURN 'payment_confirmed';
  END IF;
  
  -- Passenger accepted offer, waiting for payment
  IF booking_row.status_passenger = 'offer_accepted' THEN
    RETURN 'offer_accepted';
  END IF;
  
  -- Driver sent offer, waiting for passenger response
  IF booking_row.final_price IS NOT NULL AND booking_row.final_price != booking_row.estimated_price THEN
    RETURN 'offer_sent';
  END IF;
  
  -- Driver accepted at estimated price
  IF booking_row.status_driver = 'driver_accepted' THEN
    RETURN 'driver_accepted';
  END IF;
  
  -- Default pending state
  RETURN 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update unified_status
CREATE OR REPLACE FUNCTION public.update_unified_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unified_status = public.get_unified_booking_status(NEW);
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trigger_update_unified_status ON public.bookings;
CREATE TRIGGER trigger_update_unified_status
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_unified_status();

-- Update existing bookings to have correct unified_status
UPDATE public.bookings 
SET unified_status = public.get_unified_booking_status(bookings.*);

-- Create enhanced status history tracking
CREATE OR REPLACE FUNCTION public.track_booking_status_changes()
RETURNS TRIGGER AS $$
DECLARE
  actor_role TEXT;
  status_message TEXT;
BEGIN
  -- Determine actor role
  IF auth.uid() = NEW.driver_id THEN
    actor_role = 'driver';
  ELSIF auth.uid() = NEW.passenger_id THEN
    actor_role = 'passenger';
  ELSE
    actor_role = 'system';
  END IF;

  -- Create status message based on the change
  status_message = CASE NEW.unified_status
    WHEN 'offer_sent' THEN 'Driver sent price offer'
    WHEN 'offer_accepted' THEN 'Passenger accepted offer'
    WHEN 'payment_confirmed' THEN 'Passenger confirmed payment'
    WHEN 'all_set' THEN 'Driver confirmed payment received'
    WHEN 'driver_accepted' THEN 'Driver accepted booking'
    ELSE 'Status updated'
  END;

  -- Only insert if status actually changed
  IF TG_OP = 'UPDATE' AND OLD.unified_status != NEW.unified_status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      status,
      updated_by,
      role,
      metadata
    ) VALUES (
      NEW.id,
      NEW.unified_status,
      auth.uid(),
      actor_role,
      jsonb_build_object(
        'message', status_message,
        'previous_status', OLD.unified_status,
        'ride_status', NEW.ride_status,
        'payment_confirmation_status', NEW.payment_confirmation_status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status history tracking
DROP TRIGGER IF EXISTS trigger_track_status_changes ON public.bookings;
CREATE TRIGGER trigger_track_status_changes
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.track_booking_status_changes();

-- Enable real-time for the new tables
ALTER TABLE public.driver_offers REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.driver_offers;
