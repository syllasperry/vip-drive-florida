
-- Fix RLS policies for bookings table to allow passenger booking creation
-- The current policy is preventing passengers from creating their own bookings

-- First, let's check the current user's passenger relationship and fix the booking creation
-- We need to ensure the RLS policy allows passengers to create bookings for themselves

-- Update the existing policy to be more permissive for booking creation
DROP POLICY IF EXISTS "bookings_insert_min" ON public.bookings;

-- Create a new insert policy that allows authenticated users to create bookings
-- as long as they're creating it for a valid passenger profile
CREATE POLICY "passengers_can_create_bookings" 
ON public.bookings 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
);

-- Also ensure passengers can read their own bookings
DROP POLICY IF EXISTS "bookings_select_min" ON public.bookings;

CREATE POLICY "passengers_can_read_own_bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
);

-- And allow passengers to update their own bookings
DROP POLICY IF EXISTS "bookings_update_min" ON public.bookings;

CREATE POLICY "passengers_can_update_own_bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.passengers p 
    WHERE p.id = passenger_id 
    AND p.user_id = auth.uid()
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
);
