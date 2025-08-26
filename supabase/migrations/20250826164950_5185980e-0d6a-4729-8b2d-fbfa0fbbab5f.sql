
-- Phase 1: Critical Database Security Fixes

-- 1. Remove problematic security definer views and replace with secure functions
DROP VIEW IF EXISTS public.dispatcher_booking_cards_v CASCADE;
DROP VIEW IF EXISTS public.dispatcher_bookings_cards_v1 CASCADE;
DROP VIEW IF EXISTS public.dispatcher_bookings_cards_v2 CASCADE;
DROP VIEW IF EXISTS public.dispatcher_bookings_view CASCADE;
DROP VIEW IF EXISTS public.dispatcher_dashboard_cards_v1 CASCADE;
DROP VIEW IF EXISTS public.dispatcher_dashboard_feed CASCADE;
DROP VIEW IF EXISTS public.dispatcher_drivers_min CASCADE;
DROP VIEW IF EXISTS public.dispatcher_full_bookings CASCADE;
DROP VIEW IF EXISTS public.dispatcher_payments_totals CASCADE;
DROP VIEW IF EXISTS public.dispatcher_payments_view CASCADE;
DROP VIEW IF EXISTS public.dispatcher_recent_bookings CASCADE;
DROP VIEW IF EXISTS public.dispatcher_stats_safe CASCADE;

-- 2. Create secure replacement functions with proper access control
CREATE OR REPLACE FUNCTION public.get_dispatcher_bookings()
RETURNS TABLE(
  booking_id uuid,
  booking_code text,
  status text,
  passenger_name text,
  passenger_phone text,
  driver_name text,
  driver_phone text,
  vehicle_type text,
  distance_miles numeric,
  price_cents integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify dispatcher access
  IF NOT is_dispatcher() THEN
    RAISE EXCEPTION 'Access denied: dispatcher role required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.booking_code,
    b.status,
    COALESCE(b.passenger_first_name || ' ' || b.passenger_last_name, '') as passenger_name,
    b.passenger_phone,
    d.full_name as driver_name,
    d.phone as driver_phone,
    b.vehicle_type,
    b.distance_miles,
    COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN drivers d ON d.id = b.driver_id
  ORDER BY b.created_at DESC
  LIMIT 100;
END;
$$;

-- 3. Strengthen RLS policies on critical tables
-- Enhanced bookings RLS policy
DROP POLICY IF EXISTS "bookings_select_policy" ON public.bookings;
CREATE POLICY "bookings_select_policy" ON public.bookings
FOR SELECT USING (
  user_owns_passenger_in_booking(passenger_id) OR 
  user_is_driver_in_booking(driver_id) OR 
  is_dispatcher()
);

-- Enhanced passengers RLS policy  
DROP POLICY IF EXISTS "passengers_select_own" ON public.passengers;
CREATE POLICY "passengers_select_own" ON public.passengers
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.passenger_id = passengers.id 
    AND (b.driver_id = auth.uid() OR is_dispatcher())
  )
);

-- Enhanced drivers RLS policy
DROP POLICY IF EXISTS "drivers_select_limited" ON public.drivers;
CREATE POLICY "drivers_select_limited" ON public.drivers
FOR SELECT USING (
  id = auth.uid() OR
  is_dispatcher() OR
  EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.driver_id = drivers.id 
    AND b.passenger_id = auth.uid()
  )
);

-- 4. Add missing RLS policies for sensitive tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "admins_can_manage_roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Secure message_status table
ALTER TABLE public.message_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their message status" ON public.message_status;
CREATE POLICY "message_status_own_access" ON public.message_status
FOR ALL USING (user_id = auth.uid());

-- 6. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  resource_type text,
  resource_id text,
  user_id uuid REFERENCES auth.users(id),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_can_view_audit_log" ON public.security_audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Create secure function for password validation
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  result jsonb;
  score integer := 0;
  errors text[] := '{}';
BEGIN
  -- Length check
  IF length(password) < 8 THEN
    errors := errors || 'Password must be at least 8 characters long';
  ELSE
    score := score + 1;
  END IF;

  -- Uppercase check
  IF password !~ '[A-Z]' THEN
    errors := errors || 'Password must contain at least one uppercase letter';
  ELSE
    score := score + 1;
  END IF;

  -- Lowercase check
  IF password !~ '[a-z]' THEN
    errors := errors || 'Password must contain at least one lowercase letter';
  ELSE
    score := score + 1;
  END IF;

  -- Number check
  IF password !~ '[0-9]' THEN
    errors := errors || 'Password must contain at least one number';
  ELSE
    score := score + 1;
  END IF;

  -- Special character check
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    errors := errors || 'Password must contain at least one special character';
  ELSE
    score := score + 1;
  END IF;

  -- Common pattern check
  IF password ~* '(password|123456|qwerty|admin|letmein)' THEN
    errors := errors || 'Password contains common weak patterns';
    score := score - 1;
  END IF;

  result := jsonb_build_object(
    'is_valid', array_length(errors, 1) IS NULL,
    'score', GREATEST(score, 0),
    'errors', to_jsonb(errors)
  );

  RETURN result;
END;
$$;

-- 8. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO security_audit_log (
    action,
    resource_type,
    resource_id,
    user_id,
    details
  ) VALUES (
    p_action,
    p_resource_type,
    p_resource_id,
    auth.uid(),
    p_details || jsonb_build_object('timestamp', now(), 'ip', inet_client_addr())
  );
END;
$$;
