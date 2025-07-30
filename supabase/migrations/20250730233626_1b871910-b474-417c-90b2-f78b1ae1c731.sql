-- Add policy to allow drivers to update payment confirmation when they are assigned to the booking
CREATE POLICY "Drivers can update payment confirmation" 
ON public.bookings 
FOR UPDATE 
USING ((auth.uid())::text = (driver_id)::text);