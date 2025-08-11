
-- Phase 1: Critical Database Security Fixes

-- 1. Enable RLS on timeline_events table and add proper policies
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policy for timeline_events - users can only see timeline for their own bookings
CREATE POLICY "Users can view timeline for their bookings" 
ON public.timeline_events 
FOR SELECT 
USING (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
  )
);

-- Create policy for timeline_events - users can create timeline events for their bookings
CREATE POLICY "Users can create timeline for their bookings" 
ON public.timeline_events 
FOR INSERT 
WITH CHECK (
  booking_id IN (
    SELECT id FROM public.bookings 
    WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
  )
);

-- 2. Remove overly permissive RLS policy on bookings
DROP POLICY IF EXISTS "public_read" ON public.bookings;

-- 3. Create user_roles table for proper role-based authorization
CREATE TYPE public.app_role AS ENUM ('admin', 'dispatcher', 'driver', 'passenger');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$$;

-- Policy for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy for user_roles - admins can manage all roles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Create dispatchers table to replace hardcoded email check
CREATE TABLE public.dispatchers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on dispatchers
ALTER TABLE public.dispatchers ENABLE ROW LEVEL SECURITY;

-- Policy for dispatchers - only admins and dispatchers can view
CREATE POLICY "Dispatchers and admins can view dispatchers" 
ON public.dispatchers 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'dispatcher') OR 
  id = auth.uid()
);

-- Policy for dispatchers - only admins can manage
CREATE POLICY "Admins can manage dispatchers" 
ON public.dispatchers 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix database functions to include SET search_path
CREATE OR REPLACE FUNCTION public.user_owns_booking(booking_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = booking_id 
        AND (passenger_id = auth.uid() OR driver_id = auth.uid())
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Insert the existing dispatcher user into the new system
-- Note: Replace 'syllasperry@gmail.com' with actual dispatcher info when setting up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'dispatcher'::app_role 
FROM auth.users 
WHERE email = 'syllasperry@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Add input validation trigger for sensitive fields
CREATE OR REPLACE FUNCTION public.validate_booking_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate pickup and dropoff locations are not empty and reasonable length
  IF LENGTH(TRIM(NEW.pickup_location)) < 5 OR LENGTH(TRIM(NEW.pickup_location)) > 500 THEN
    RAISE EXCEPTION 'Invalid pickup location length';
  END IF;
  
  IF LENGTH(TRIM(NEW.dropoff_location)) < 5 OR LENGTH(TRIM(NEW.dropoff_location)) > 500 THEN
    RAISE EXCEPTION 'Invalid dropoff location length';
  END IF;
  
  -- Validate passenger count is reasonable
  IF NEW.passenger_count < 1 OR NEW.passenger_count > 20 THEN
    RAISE EXCEPTION 'Invalid passenger count';
  END IF;
  
  -- Validate pickup time is not too far in the past or future
  IF NEW.pickup_time < (now() - INTERVAL '1 hour') OR NEW.pickup_time > (now() + INTERVAL '1 year') THEN
    RAISE EXCEPTION 'Invalid pickup time';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply validation trigger to bookings
DROP TRIGGER IF EXISTS validate_booking_input_trigger ON public.bookings;
CREATE TRIGGER validate_booking_input_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_input();
