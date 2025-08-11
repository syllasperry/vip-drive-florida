
-- First, let's ensure the dispatcher can view all bookings by updating RLS policies
-- Remove the restrictive policy that only allows dispatchers to see their assigned bookings
DROP POLICY IF EXISTS "Dispatchers see only their bookings" ON public.bookings;

-- Add a comprehensive policy for dispatchers to view all bookings
CREATE POLICY "Dispatchers can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (
  -- Allow dispatchers (syllasperry@gmail.com) to see all bookings
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'syllasperry@gmail.com'
  )
  OR
  -- Allow users with dispatcher role to see all bookings
  has_role(auth.uid(), 'dispatcher'::app_role)
);

-- Ensure dispatchers can update bookings (assign drivers, set prices)
CREATE POLICY "Dispatchers can update all bookings" 
ON public.bookings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE users.id = auth.uid() 
    AND users.email = 'syllasperry@gmail.com'
  )
  OR
  has_role(auth.uid(), 'dispatcher'::app_role)
);

-- Enable realtime for the bookings table
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
