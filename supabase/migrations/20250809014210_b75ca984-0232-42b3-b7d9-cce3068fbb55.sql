
-- Remove the automatic driver assignment trigger and function
DROP TRIGGER IF EXISTS trg_assign_matching_drivers ON bookings;
DROP FUNCTION IF EXISTS assign_matching_drivers();

-- Remove the find_matching_drivers function as it's no longer needed for auto-assignment
-- (keeping it for now in case dispatcher needs to search drivers manually)

-- Update the booking trigger to ensure proper status updates when dispatcher assigns driver and price
CREATE OR REPLACE FUNCTION update_booking_status_on_dispatcher_action()
RETURNS TRIGGER AS $$
BEGIN
  -- When dispatcher assigns both final_price AND driver_id, update status to offer_sent
  IF NEW.final_price IS NOT NULL AND NEW.driver_id IS NOT NULL AND 
     (OLD.final_price IS NULL OR OLD.driver_id IS NULL OR 
      NEW.final_price != OLD.final_price OR NEW.driver_id != OLD.driver_id) THEN
    
    NEW.status = 'offer_sent';
    NEW.ride_status = 'offer_sent';
    NEW.payment_confirmation_status = 'waiting_for_payment';
    
    -- Log the status change
    RAISE NOTICE 'Booking % status updated to offer_sent by dispatcher action', NEW.id;
  END IF;
  
  -- Always update timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS trg_update_booking_status_on_price ON bookings;
CREATE TRIGGER trg_update_booking_status_on_dispatcher_action
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_status_on_dispatcher_action();

-- Ensure realtime is properly configured
ALTER TABLE bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
