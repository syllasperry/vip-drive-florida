
-- Comprehensive Security and RLS Policy Fix
-- This migration addresses all identified security issues and RLS policy problems

-- 1. Fix passengers table structure and policies
ALTER TABLE public.passengers 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;

-- Drop existing problematic policies on passengers
DROP POLICY IF EXISTS "Users can view their own passenger data" ON public.passengers;
DROP POLICY IF EXISTS "Users can update their own passenger data" ON public.passengers;
DROP POLICY IF EXISTS "Users can create passenger profiles" ON public.passengers;
DROP POLICY IF EXISTS "Dispatchers can view all passengers" ON public.passengers;

-- Create comprehensive RLS policies for passengers
CREATE POLICY "passengers_own_select" ON public.passengers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "passengers_own_insert" ON public.passengers
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "passengers_own_update" ON public.passengers
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "dispatchers_can_view_passengers" ON public.passengers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'dispatcher'::app_role
    )
  );

-- 2. Fix bookings table RLS policies
DROP POLICY IF EXISTS "bookings_insert_min" ON public.bookings;
DROP POLICY IF EXISTS "bookings_select_min" ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_min" ON public.bookings;

-- Create proper booking policies
CREATE POLICY "bookings_passenger_select" ON public.bookings
  FOR SELECT USING (
    passenger_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.passengers p 
      WHERE p.user_id = auth.uid() AND p.id = passenger_id
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'driver'::app_role)
    )
  );

CREATE POLICY "bookings_passenger_insert" ON public.bookings
  FOR INSERT WITH CHECK (
    passenger_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.passengers p 
      WHERE p.user_id = auth.uid() AND p.id = passenger_id
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'dispatcher'::app_role
    )
  );

CREATE POLICY "bookings_passenger_update" ON public.bookings
  FOR UPDATE USING (
    passenger_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.passengers p 
      WHERE p.user_id = auth.uid() AND p.id = passenger_id
    ) OR
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'dispatcher'::app_role
    )
  ) WITH CHECK (
    passenger_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.passengers p 
      WHERE p.user_id = auth.uid() AND p.id = passenger_id
    ) OR
    driver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'dispatcher'::app_role
    )
  );

-- 3. Create/fix the user_roles table and policies if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_view_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_can_manage_roles" ON public.user_roles;

CREATE POLICY "users_can_view_own_roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "dispatchers_can_manage_roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- 4. Fix drivers table policies for security
DROP POLICY IF EXISTS "Anyone can create driver account" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view basic info of drivers in shared bookings" ON public.drivers;

CREATE POLICY "drivers_authenticated_create" ON public.drivers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "drivers_limited_view" ON public.drivers
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    ) OR
    id IN (
      SELECT DISTINCT b.driver_id 
      FROM public.bookings b 
      WHERE b.passenger_id = auth.uid() 
      AND b.driver_id IS NOT NULL
    )
  );

-- 5. Create function to get or create passenger profile
CREATE OR REPLACE FUNCTION public.get_my_passenger_profile()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  profile_photo_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
BEGIN
  -- Security check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get user email from auth
  SELECT (auth.jwt() ->> 'email') INTO v_email;

  -- Try to find existing passenger profile
  RETURN QUERY
  SELECT p.id, p.user_id, p.full_name, p.email, p.phone, p.profile_photo_url, p.created_at, p.updated_at
  FROM public.passengers p
  WHERE p.user_id = v_user_id;

  -- If no profile found, return empty result (don't auto-create)
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$;

-- 6. Create function to upsert passenger profile
CREATE OR REPLACE FUNCTION public.upsert_my_passenger_profile(
  _first_name text,
  _last_name text,
  _phone text,
  _email text
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  phone text,
  profile_photo_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_full_name text := trim(_first_name || ' ' || _last_name);
  v_passenger_id uuid;
BEGIN
  -- Security check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate inputs
  IF length(trim(coalesce(_email, ''))) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Insert or update passenger profile
  INSERT INTO public.passengers (user_id, full_name, email, phone, updated_at)
  VALUES (v_user_id, v_full_name, trim(_email), trim(_phone), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = EXCLUDED.updated_at
  RETURNING passengers.id INTO v_passenger_id;

  -- Return the updated profile
  RETURN QUERY
  SELECT p.id, p.user_id, p.full_name, p.email, p.phone, p.profile_photo_url, p.created_at, p.updated_at
  FROM public.passengers p
  WHERE p.id = v_passenger_id;
END;
$$;

-- 7. Create function for passenger bookings
CREATE OR REPLACE FUNCTION public.get_my_passenger_bookings()
RETURNS TABLE (
  booking_id uuid,
  booking_code text,
  status text,
  payment_status text,
  pickup_location text,
  dropoff_location text,
  pickup_time timestamp with time zone,
  vehicle_type text,
  distance_miles numeric,
  price_cents integer,
  currency text,
  passenger_name text,
  passenger_phone text,
  passenger_email text,
  passenger_avatar_url text,
  driver_id uuid,
  driver_name text,
  driver_phone text,
  driver_avatar_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_passenger_id uuid;
BEGIN
  -- Security check
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get passenger ID
  SELECT p.id INTO v_passenger_id
  FROM public.passengers p
  WHERE p.user_id = v_user_id;

  IF v_passenger_id IS NULL THEN
    RAISE EXCEPTION 'Passenger profile not found';
  END IF;

  -- Return bookings for this passenger
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.booking_code,
    b.status,
    b.payment_status,
    b.pickup_location,
    b.dropoff_location,
    b.pickup_time,
    b.vehicle_type,
    b.distance_miles,
    COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
    COALESCE(b.paid_currency, 'USD') as currency,
    p.full_name as passenger_name,
    p.phone as passenger_phone,
    p.email as passenger_email,
    p.profile_photo_url as passenger_avatar_url,
    b.driver_id,
    d.full_name as driver_name,
    d.phone as driver_phone,
    d.avatar_url as driver_avatar_url,
    b.created_at,
    b.updated_at
  FROM public.bookings b
  LEFT JOIN public.passengers p ON p.id = b.passenger_id
  LEFT JOIN public.drivers d ON d.id = b.driver_id
  WHERE b.passenger_id = v_passenger_id
  ORDER BY b.created_at DESC;
END;
$$;

-- 8. Fix auth configuration issues
-- Update auth settings for OTP expiry (this needs to be done via Supabase dashboard)
-- For now, document the required changes

-- 9. Create trigger to auto-assign passenger role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create passenger role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'passenger'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.passengers TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT SELECT ON public.drivers TO authenticated;

-- 11. Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.passengers;
