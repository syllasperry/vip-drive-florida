-- Update bookings table to support all required statuses
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add constraint for all possible status values
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'canceled'));

-- Add updated_at trigger (drop and recreate if exists)
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();