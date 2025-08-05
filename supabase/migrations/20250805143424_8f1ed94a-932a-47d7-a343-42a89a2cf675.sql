-- Add new status columns to align passenger and driver statuses
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status_passenger text DEFAULT 'passenger_requested',
ADD COLUMN IF NOT EXISTS status_driver text DEFAULT 'new_request';

-- Create function to automatically sync to all_set status
CREATE OR REPLACE FUNCTION auto_sync_to_all_set()
RETURNS TRIGGER AS $$
BEGIN
  -- When both passenger confirms payment and driver accepts, set all_set
  IF NEW.status_passenger = 'payment_confirmed' AND NEW.status_driver = 'driver_accepted' THEN
    NEW.status_passenger = 'all_set';
    NEW.status_driver = 'all_set';
    NEW.ride_status = 'all_set';
    NEW.payment_confirmation_status = 'all_set';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto sync
DROP TRIGGER IF EXISTS trigger_auto_sync_all_set ON bookings;
CREATE TRIGGER trigger_auto_sync_all_set
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_to_all_set();

-- Enable realtime for bookings table
ALTER TABLE bookings REPLICA IDENTITY FULL;

-- Add bookings to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;
END $$;