-- Remove the status constraint completely to allow flexible status values
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;