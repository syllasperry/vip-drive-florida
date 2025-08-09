
-- Disable the automatic driver assignment trigger
DROP TRIGGER IF EXISTS auto_assign_driver_trigger ON bookings;

-- Remove any existing auto-assigned drivers for booking #3C5F90F3
UPDATE bookings 
SET driver_id = NULL, status = 'pending'
WHERE id = '3c5f90f3-0000-0000-0000-000000000000'::uuid
AND driver_id IS NOT NULL;

-- Also remove the assign_matching_drivers function since we don't want automatic assignment
DROP FUNCTION IF EXISTS assign_matching_drivers();
