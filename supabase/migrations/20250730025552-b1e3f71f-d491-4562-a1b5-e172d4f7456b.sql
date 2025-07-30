-- Fix security issue: Set search_path for function security (with CASCADE)
DROP FUNCTION IF EXISTS update_booking_timestamps() CASCADE;

CREATE OR REPLACE FUNCTION update_booking_timestamps()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER booking_status_timestamps
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_timestamps();