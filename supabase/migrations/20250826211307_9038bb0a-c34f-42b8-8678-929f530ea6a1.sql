
-- Add missing payment tracking columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_provider text,
ADD COLUMN IF NOT EXISTS payment_reference text;

-- Update the trigger to handle new payment columns
CREATE OR REPLACE FUNCTION public.update_booking_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.ride_status != OLD.ride_status THEN
    NEW.updated_at = now();
  END IF;
  
  IF NEW.payment_confirmation_status != OLD.payment_confirmation_status THEN
    NEW.updated_at = now();
    
    -- Set passenger payment confirmation timestamp
    IF NEW.payment_confirmation_status = 'passenger_paid' AND OLD.payment_confirmation_status != 'passenger_paid' THEN
      NEW.passenger_payment_confirmed_at = now();
    END IF;
    
    -- Set driver payment confirmation timestamp  
    IF NEW.payment_confirmation_status = 'all_set' AND OLD.payment_confirmation_status != 'all_set' THEN
      NEW.driver_payment_confirmed_at = now();
    END IF;
  END IF;
  
  -- Set paid_at when payment_status changes to paid
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    NEW.paid_at = COALESCE(NEW.paid_at, now());
  END IF;
  
  RETURN NEW;
END;
$function$;
