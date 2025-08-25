
-- Fix infinite recursion in drivers table RLS policies by creating security definer functions

-- First, create a security definer function to check if user is a dispatcher
CREATE OR REPLACE FUNCTION public.is_user_dispatcher(user_uuid uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid AND email = 'syllasperry@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a security definer function to check if user owns a driver record
CREATE OR REPLACE FUNCTION public.user_owns_driver_record(driver_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN driver_uuid = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a security definer function to check if user can view driver in shared bookings
CREATE OR REPLACE FUNCTION public.can_view_driver_in_bookings(driver_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings b1
    JOIN bookings b2 ON b1.passenger_id = b2.passenger_id
    WHERE b1.driver_id = driver_uuid AND b2.driver_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a security definer function to check if user can view assigned driver
CREATE OR REPLACE FUNCTION public.can_view_assigned_driver(driver_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE driver_id = driver_uuid AND passenger_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can create driver account" ON public.drivers;
DROP POLICY IF EXISTS "Dispatcher can manage all drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can update their own data" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view basic info of drivers in shared bookings" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view their own data" ON public.drivers;
DROP POLICY IF EXISTS "Passengers can view assigned driver basic info" ON public.drivers;

-- Create new policies using security definer functions
CREATE POLICY "drivers_insert_allow_all" ON public.drivers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "drivers_select_dispatcher" ON public.drivers
  FOR SELECT USING (is_user_dispatcher());

CREATE POLICY "drivers_update_dispatcher" ON public.drivers
  FOR UPDATE USING (is_user_dispatcher())
  WITH CHECK (is_user_dispatcher());

CREATE POLICY "drivers_delete_dispatcher" ON public.drivers
  FOR DELETE USING (is_user_dispatcher());

CREATE POLICY "drivers_select_own_data" ON public.drivers
  FOR SELECT USING (user_owns_driver_record(id));

CREATE POLICY "drivers_update_own_data" ON public.drivers
  FOR UPDATE USING (user_owns_driver_record(id))
  WITH CHECK (user_owns_driver_record(id));

CREATE POLICY "drivers_select_shared_bookings" ON public.drivers
  FOR SELECT USING (can_view_driver_in_bookings(id));

CREATE POLICY "drivers_select_assigned_driver" ON public.drivers
  FOR SELECT USING (can_view_assigned_driver(id));
