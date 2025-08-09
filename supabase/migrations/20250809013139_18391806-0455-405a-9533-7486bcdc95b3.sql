
-- Create or replace the function to update booking status when final price is set
CREATE OR REPLACE FUNCTION update_booking_status_on_price()
RETURNS TRIGGER AS $$
BEGIN
  -- When final_price is set and driver_id is assigned, update status to offer_sent
  IF NEW.final_price IS NOT NULL AND NEW.driver_id IS NOT NULL AND 
     (OLD.final_price IS NULL OR OLD.driver_id IS NULL) THEN
    NEW.status = 'offer_sent';
    NEW.ride_status = 'offer_sent';
    NEW.payment_confirmation_status = 'waiting_for_payment';
  END IF;
  
  -- Always update the timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS trg_update_booking_status_on_price ON bookings;
CREATE TRIGGER trg_update_booking_status_on_price
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_status_on_price();

-- Enable realtime updates for bookings table
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
