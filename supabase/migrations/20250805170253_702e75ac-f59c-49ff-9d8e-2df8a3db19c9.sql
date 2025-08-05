-- Add separate status fields for driver and passenger perspectives
ALTER TABLE bookings 
ADD COLUMN driver_status TEXT,
ADD COLUMN passenger_status TEXT;

-- Update existing records with initial status based on current state
UPDATE bookings 
SET 
  driver_status = CASE 
    WHEN ride_status = 'driver_accepted' OR status_driver = 'driver_accepted' THEN 'Driver Accepted'
    WHEN ride_status = 'pending_driver' OR status_driver = 'new_request' THEN 'Pending Response'
    WHEN ride_status = 'offer_sent' THEN 'Offer Sent'
    WHEN ride_status = 'driver_rejected' OR status_driver = 'driver_rejected' THEN 'Driver Declined'
    WHEN ride_stage = 'driver_heading_to_pickup' THEN 'Heading to Pickup'
    WHEN ride_stage = 'driver_arrived_at_pickup' THEN 'Arrived at Pickup'
    WHEN ride_stage = 'passenger_onboard' THEN 'Passenger Onboard'
    WHEN ride_stage = 'in_transit' THEN 'In Transit'
    WHEN ride_stage = 'completed' THEN 'Ride Completed'
    ELSE 'Awaiting Response'
  END,
  passenger_status = CASE 
    WHEN payment_confirmation_status = 'passenger_paid' THEN 'Payment Confirmed'
    WHEN payment_confirmation_status = 'all_set' THEN 'All Set'
    WHEN status_passenger = 'payment_confirmed' THEN 'Payment Confirmed'
    WHEN status_passenger = 'passenger_requested' THEN 'Ride Requested'
    WHEN ride_status = 'driver_accepted' THEN 'Waiting for Payment'
    WHEN ride_status = 'offer_sent' THEN 'Review Offer'
    WHEN ride_stage = 'driver_heading_to_pickup' THEN 'Driver En Route'
    WHEN ride_stage = 'driver_arrived_at_pickup' THEN 'Driver Arrived'
    WHEN ride_stage = 'passenger_onboard' THEN 'Ride Started'
    WHEN ride_stage = 'in_transit' THEN 'In Transit'
    WHEN ride_stage = 'completed' THEN 'Ride Completed'
    ELSE 'Waiting for Driver'
  END
WHERE driver_status IS NULL OR passenger_status IS NULL;

-- Create function to update status fields when booking changes
CREATE OR REPLACE FUNCTION update_timeline_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update driver status based on latest driver action
  IF NEW.status_driver != OLD.status_driver OR NEW.ride_status != OLD.ride_status OR NEW.ride_stage != OLD.ride_stage THEN
    NEW.driver_status = CASE 
      WHEN NEW.ride_status = 'driver_accepted' OR NEW.status_driver = 'driver_accepted' THEN 'Driver Accepted'
      WHEN NEW.ride_status = 'offer_sent' THEN 'Offer Sent'
      WHEN NEW.ride_status = 'driver_rejected' OR NEW.status_driver = 'driver_rejected' THEN 'Driver Declined'
      WHEN NEW.ride_stage = 'driver_heading_to_pickup' THEN 'Heading to Pickup'
      WHEN NEW.ride_stage = 'driver_arrived_at_pickup' THEN 'Arrived at Pickup'
      WHEN NEW.ride_stage = 'passenger_onboard' THEN 'Passenger Onboard'
      WHEN NEW.ride_stage = 'in_transit' THEN 'In Transit'
      WHEN NEW.ride_stage = 'completed' THEN 'Ride Completed'
      ELSE COALESCE(NEW.driver_status, 'Pending Response')
    END;
  END IF;

  -- Update passenger status based on latest passenger action or next required step
  IF NEW.status_passenger != OLD.status_passenger OR NEW.payment_confirmation_status != OLD.payment_confirmation_status OR NEW.ride_stage != OLD.ride_stage THEN
    NEW.passenger_status = CASE 
      WHEN NEW.payment_confirmation_status = 'all_set' THEN 'All Set'
      WHEN NEW.payment_confirmation_status = 'passenger_paid' OR NEW.status_passenger = 'payment_confirmed' THEN 'Payment Confirmed'
      WHEN NEW.status_passenger = 'passenger_requested' THEN 'Ride Requested'
      WHEN NEW.ride_status = 'driver_accepted' AND NEW.payment_confirmation_status = 'waiting_for_offer' THEN 'Waiting for Payment'
      WHEN NEW.ride_status = 'offer_sent' THEN 'Review Offer'
      WHEN NEW.ride_stage = 'driver_heading_to_pickup' THEN 'Driver En Route'
      WHEN NEW.ride_stage = 'driver_arrived_at_pickup' THEN 'Driver Arrived'
      WHEN NEW.ride_stage = 'passenger_onboard' THEN 'Ride Started'
      WHEN NEW.ride_stage = 'in_transit' THEN 'In Transit'
      WHEN NEW.ride_stage = 'completed' THEN 'Ride Completed'
      ELSE COALESCE(NEW.passenger_status, 'Waiting for Driver')
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timeline status
CREATE TRIGGER update_booking_timeline_status
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_timeline_status();