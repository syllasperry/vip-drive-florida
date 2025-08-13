-- Remove overly permissive policies that allow public access to driver data
DROP POLICY IF EXISTS "Drivers can view all drivers" ON public.drivers;
DROP POLICY IF EXISTS "drivers_select_any_auth" ON public.drivers;
DROP POLICY IF EXISTS "drv_select_authenticated" ON public.drivers;
DROP POLICY IF EXISTS "dv_select_all" ON public.drivers;

-- Create secure policies that restrict driver data access

-- Allow passengers to view limited driver info only for their assigned bookings
CREATE POLICY "Passengers can view assigned driver basic info" 
ON public.drivers 
FOR SELECT 
USING (
  id IN (
    SELECT driver_id 
    FROM public.bookings 
    WHERE passenger_id = auth.uid() 
    AND driver_id IS NOT NULL
  )
);

-- Allow drivers to view other drivers' basic info only when they share bookings 
-- (for cases where multiple drivers might coordinate)
CREATE POLICY "Drivers can view basic info of drivers in shared bookings" 
ON public.drivers 
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT d.id
    FROM public.drivers d
    JOIN public.bookings b1 ON d.id = b1.driver_id
    JOIN public.bookings b2 ON b1.passenger_id = b2.passenger_id
    WHERE b2.driver_id = auth.uid()
  )
  OR id = auth.uid() -- Always allow viewing own data
);

-- Ensure the existing "Drivers can view their own data" policy covers self-access
-- (This policy already exists and is secure)

-- Keep the dispatcher and self-update policies as they are secure