-- Update ride_status column to use the new standardized values
-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS bookings_ride_status_idx ON public.bookings(ride_status);

-- Create function to standardize ride status updates
CREATE OR REPLACE FUNCTION public.sync_ride_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Standardize ride_status based on other status fields for backward compatibility
  IF NEW.status_driver = 'driver_accepted' AND NEW.ride_status != 'offer_sent' THEN
    NEW.ride_status = 'accepted_by_driver';
  END IF;
  
  IF NEW.status_driver = 'offer_sent' OR (NEW.status_driver = 'driver_accepted' AND NEW.final_price IS NOT NULL) THEN
    NEW.ride_status = 'offer_sent';
  END IF;
  
  IF NEW.status_passenger = 'offer_accepted' OR NEW.payment_confirmation_status = 'passenger_paid' THEN
    NEW.ride_status = 'offer_accepted';
  END IF;
  
  IF NEW.payment_confirmation_status = 'all_set' THEN
    NEW.ride_status = 'all_set';
  END IF;
  
  -- Update timestamps
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync ride status
DROP TRIGGER IF EXISTS sync_ride_status_trigger ON public.bookings;
CREATE TRIGGER sync_ride_status_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_ride_status();