-- Add missing status values to the bookings status check constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'declined', 'price_proposed', 'payment_confirmed', 'rejected_by_passenger'));