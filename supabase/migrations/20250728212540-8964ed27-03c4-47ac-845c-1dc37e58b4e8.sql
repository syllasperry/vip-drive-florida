-- Update RLS policies for bookings to allow drivers to accept/decline pending requests

-- Drop the existing restrictive driver update policy
DROP POLICY IF EXISTS "Drivers can update their bookings" ON bookings;

-- Create a new policy that allows drivers to accept pending bookings
CREATE POLICY "Drivers can accept pending bookings" 
ON bookings 
FOR UPDATE 
USING (
  -- Driver can update if they are already assigned to the booking
  (auth.uid()::text = driver_id::text) 
  OR 
  -- Driver can accept a pending booking that matches their vehicle type
  (status = 'pending' AND driver_id IS NULL AND auth.uid() IN (
    SELECT id FROM drivers 
    WHERE LOWER(TRIM(car_make || ' ' || car_model)) = LOWER(TRIM(vehicle_type))
       OR vehicle_type IS NULL
  ))
);