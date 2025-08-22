
-- Fix infinite recursion in bookings RLS policies by using security definer functions

-- First, drop the problematic policies
DROP POLICY IF EXISTS "authenticated_users_can_create_bookings" ON public.bookings;
DROP POLICY IF EXISTS "users_can_read_own_bookings" ON public.bookings;  
DROP POLICY IF EXISTS "users_can_update_own_bookings" ON public.bookings;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.user_owns_passenger_in_booking(booking_passenger_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = booking_passenger_id 
    AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_driver_in_booking(booking_driver_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.drivers d 
    WHERE d.id = booking_driver_id 
    AND d.id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_dispatcher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  );
$$;

-- Create new policies using the security definer functions
CREATE POLICY "bookings_insert_policy" ON public.bookings
FOR INSERT 
TO authenticated
WITH CHECK (
  public.user_owns_passenger_in_booking(passenger_id)
);

CREATE POLICY "bookings_select_policy" ON public.bookings
FOR SELECT 
TO authenticated
USING (
  public.user_owns_passenger_in_booking(passenger_id)
  OR 
  public.user_is_driver_in_booking(driver_id)
  OR 
  public.user_is_dispatcher()
);

CREATE POLICY "bookings_update_policy" ON public.bookings
FOR UPDATE 
TO authenticated
USING (
  public.user_owns_passenger_in_booking(passenger_id)
  OR 
  public.user_is_driver_in_booking(driver_id)
  OR 
  public.user_is_dispatcher()
)
WITH CHECK (
  public.user_owns_passenger_in_booking(passenger_id)
  OR 
  public.user_is_driver_in_booking(driver_id)
  OR 
  public.user_is_dispatcher()
);
