
-- Fix RLS policies for passengers table to allow passenger profile creation

-- Check current policies on passengers table and fix them
DROP POLICY IF EXISTS "Users can view their own passenger data" ON public.passengers;
DROP POLICY IF EXISTS "Users can update their own passenger data" ON public.passengers;
DROP POLICY IF EXISTS "Users can create their own passenger profile" ON public.passengers;

-- Create proper RLS policies for passengers table
CREATE POLICY "passengers_select_policy" ON public.passengers
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "passengers_insert_policy" ON public.passengers
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "passengers_update_policy" ON public.passengers
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Also ensure the get_or_create_passenger_profile function can bypass RLS
-- by making it SECURITY DEFINER and ensuring it sets the user_id correctly
CREATE OR REPLACE FUNCTION public.get_or_create_passenger_profile(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
