
-- Fix RLS policies for bookings table to allow proper passenger booking creation

-- First, let's check the current passenger_id assignment issue
-- The problem is likely that we're trying to insert with passenger_id that doesn't match auth.uid()
-- We need to ensure the passenger profile exists and is properly linked

-- Update the bookings RLS policy to be more permissive for authenticated users creating their own bookings
DROP POLICY IF EXISTS "passengers_can_create_bookings" ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert_passenger_owner" ON public.bookings;

-- Create a more robust policy that allows booking creation when passenger profile exists
CREATE POLICY "authenticated_users_can_create_bookings" ON public.bookings
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow if the passenger_id corresponds to a passenger record owned by the authenticated user
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
);

-- Also ensure we can read our own bookings
DROP POLICY IF EXISTS "passengers_can_read_own_bookings" ON public.bookings;

CREATE POLICY "users_can_read_own_bookings" ON public.bookings
FOR SELECT 
TO authenticated
USING (
  -- Can read if you're the passenger
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
  OR
  -- Can read if you're the driver  
  EXISTS (
    SELECT 1 FROM public.drivers d 
    WHERE d.id = driver_id 
    AND d.id = auth.uid()
  )
  OR
  -- Can read if you're a dispatcher
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
);

-- Update policy for updating bookings
DROP POLICY IF EXISTS "passengers_can_update_own_bookings" ON public.bookings;

CREATE POLICY "users_can_update_own_bookings" ON public.bookings
FOR UPDATE 
TO authenticated
USING (
  -- Can update if you're the passenger
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
  OR
  -- Can update if you're the driver
  EXISTS (
    SELECT 1 FROM public.drivers d 
    WHERE d.id = driver_id 
    AND d.id = auth.uid()
  )
  OR
  -- Can update if you're a dispatcher
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
)
WITH CHECK (
  -- Same conditions for the updated row
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.drivers d 
    WHERE d.id = driver_id 
    AND d.id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
);

-- Ensure passengers table has proper RLS policies
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

-- Drop existing passenger policies if they exist
DROP POLICY IF EXISTS "passengers_can_read_own_profile" ON public.passengers;
DROP POLICY IF EXISTS "passengers_can_update_own_profile" ON public.passengers;
DROP POLICY IF EXISTS "passengers_can_create_profile" ON public.passengers;

-- Allow users to read their own passenger profile
CREATE POLICY "users_can_read_own_passenger_profile" ON public.passengers
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow users to update their own passenger profile  
CREATE POLICY "users_can_update_own_passenger_profile" ON public.passengers
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow users to create their own passenger profile
CREATE POLICY "users_can_create_passenger_profile" ON public.passengers
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create a helper function to get or create passenger profile
CREATE OR REPLACE FUNCTION public.get_or_create_passenger_profile(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_passenger_id uuid;
  v_user_email text;
  v_user_name text;
BEGIN
  -- First try to get existing passenger
  SELECT id INTO v_passenger_id
  FROM public.passengers
  WHERE user_id = p_user_id;
  
  -- If found, return it
  IF v_passenger_id IS NOT NULL THEN
    RETURN v_passenger_id;
  END IF;
  
  -- Get user info from auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', email) 
  INTO v_user_email, v_user_name
  FROM auth.users 
  WHERE id = p_user_id;
  
  -- Create new passenger profile
  INSERT INTO public.passengers (user_id, full_name, email)
  VALUES (p_user_id, v_user_name, v_user_email)
  RETURNING id INTO v_passenger_id;
  
  RETURN v_passenger_id;
END;
$$;
