-- Allow drivers to view passenger profiles for their assigned bookings
CREATE POLICY "Drivers can view passenger profiles for assigned bookings" 
ON public.passengers 
FOR SELECT 
USING (
  id IN (
    SELECT passenger_id 
    FROM public.bookings 
    WHERE driver_id = auth.uid()
  )
);