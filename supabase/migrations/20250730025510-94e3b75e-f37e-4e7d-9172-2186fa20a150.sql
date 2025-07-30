-- Update bookings table to support new status system
ALTER TABLE bookings 
ADD COLUMN ride_status TEXT DEFAULT 'pending_driver',
ADD COLUMN payment_confirmation_status TEXT DEFAULT 'waiting_for_offer';

-- Update existing bookings to use new status system
UPDATE bookings 
SET ride_status = CASE 
  WHEN status = 'pending' THEN 'pending_driver'
  WHEN status = 'accepted' THEN 'offer_sent' 
  WHEN status = 'payment_confirmed' THEN 'confirmed'
  WHEN status = 'in_progress' THEN 'in_progress'
  WHEN status = 'completed' THEN 'completed'
  WHEN status = 'cancelled' THEN 'canceled'
  ELSE 'pending_driver'
END;

UPDATE bookings 
SET payment_confirmation_status = CASE 
  WHEN payment_status = 'pending' AND ride_status = 'pending_driver' THEN 'waiting_for_offer'
  WHEN payment_status = 'pending' AND ride_status = 'offer_sent' THEN 'price_awaiting_acceptance'
  WHEN payment_status = 'confirmed' THEN 'all_set'
  ELSE 'waiting_for_offer'
END;

-- Add new columns for enhanced payment flow
ALTER TABLE bookings
ADD COLUMN driver_payment_instructions TEXT,
ADD COLUMN passenger_payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN driver_payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_fare NUMERIC(10,2),
ADD COLUMN distance_miles NUMERIC(8,2);

-- Create index for better performance on status queries
CREATE INDEX idx_bookings_ride_status ON bookings(ride_status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_confirmation_status);

-- Add trigger to automatically update timestamps
CREATE OR REPLACE FUNCTION update_booking_timestamps()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_status_timestamps
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_timestamps();