
-- Disable the automatic driver assignment trigger that assigns drivers based on vehicle type
DROP TRIGGER IF EXISTS assign_matching_drivers_trigger ON bookings;

-- Remove the function that was automatically assigning drivers
DROP FUNCTION IF EXISTS assign_matching_drivers();

-- Update the booking update function to properly handle dispatcher actions
CREATE OR REPLACE FUNCTION update_booking_with_dispatcher_offer()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamps when status actually changes
    IF NEW.status IS DISTINCT FROM OLD.status OR 
       NEW.final_price IS DISTINCT FROM OLD.final_price OR
       NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
        NEW.updated_at = NOW();
    END IF;
    
    -- When dispatcher sends offer (status = 'offer_sent'), ensure proper status mapping
    IF NEW.status = 'offer_sent' AND OLD.status != 'offer_sent' THEN
        NEW.ride_status = 'offer_sent';
        NEW.payment_confirmation_status = 'waiting_for_payment';
        NEW.status_passenger = 'offer_sent';
        NEW.status_driver = 'offer_sent';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the updated function
CREATE TRIGGER update_booking_dispatcher_offer_trigger
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_with_dispatcher_offer();

-- Ensure bookings table has proper default values for new bookings (no auto-assignment)
ALTER TABLE bookings ALTER COLUMN driver_id DROP DEFAULT;
