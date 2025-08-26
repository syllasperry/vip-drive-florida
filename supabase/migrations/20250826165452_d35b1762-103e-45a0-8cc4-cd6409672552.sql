-- Phase 2: Remove All Security Definer Views

-- Drop all problematic security definer views
DROP VIEW IF EXISTS public.booking_notification_prefs_v1 CASCADE;
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
DROP VIEW IF EXISTS public.my_passenger_bookings CASCADE;
DROP VIEW IF EXISTS public.my_passenger_bookings_v1 CASCADE;
DROP VIEW IF EXISTS public.passenger_dashboard_cards_v1 CASCADE;
DROP VIEW IF EXISTS public.passenger_dashboard_cards_v2 CASCADE;
DROP VIEW IF EXISTS public.passenger_dashboard_feed CASCADE;
DROP VIEW IF EXISTS public.passenger_my_bookings CASCADE;
DROP VIEW IF EXISTS public.security_definer_functions_audit CASCADE;
DROP VIEW IF EXISTS public.v_booking_pricing_preview CASCADE;
DROP VIEW IF EXISTS public.v_system_settings CASCADE;
DROP VIEW IF EXISTS public.vw_dispatcher_booking_card CASCADE;
DROP VIEW IF EXISTS public.vw_dispatcher_bookings CASCADE;
DROP VIEW IF EXISTS public.vw_passenger_bookings CASCADE;

-- Create secure replacement functions for essential functionality

-- 1. Passenger bookings function (replaces my_passenger_bookings views)
CREATE OR REPLACE FUNCTION public.get_my_passenger_bookings()
RETURNS TABLE(
  booking_id uuid,
  booking_code text,
  status text,
  pickup_location text,
  dropoff_location text,
  pickup_time timestamptz,
  distance_miles numeric,
  price_cents integer,
  price_dollars numeric,
  currency text,
  driver_id uuid,
  driver_name text,
  vehicle_type text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Verify user authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.booking_code,
    b.status,
    b.pickup_location,
    b.dropoff_location,
    b.pickup_time,
    b.distance_miles,
    COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
    ROUND(COALESCE(b.final_price_cents, b.estimated_price_cents, 0) / 100.0, 2) as price_dollars,
    'USD' as currency,
    b.driver_id,
    d.full_name as driver_name,
    b.vehicle_type,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN drivers d ON d.id = b.driver_id
  LEFT JOIN passengers p ON p.id = b.passenger_id
  WHERE p.user_id = current_user_id
  ORDER BY b.created_at DESC
  LIMIT 100;
END;
$$;

-- 2. Dispatcher dashboard function (replaces dispatcher dashboard views)
CREATE OR REPLACE FUNCTION public.get_dispatcher_dashboard_data()
RETURNS TABLE(
  booking_id uuid,
  booking_code text,
  status text,
  passenger_id uuid,
  passenger_name text,
  passenger_phone text,
  passenger_avatar_url text,
  driver_id uuid,
  driver_name text,
  driver_phone text,
  driver_avatar_url text,
  vehicle_type text,
  distance_miles numeric,
  price_cents integer,
  price_dollars numeric,
  currency text,
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
    b.id as booking_id,
    b.booking_code,
    b.status,
    b.passenger_id,
    COALESCE(b.passenger_first_name || ' ' || b.passenger_last_name, p.full_name, '') as passenger_name,
    COALESCE(b.passenger_phone, p.phone) as passenger_phone,
    COALESCE(b.passenger_photo_url, p.profile_photo_url) as passenger_avatar_url,
    b.driver_id,
    d.full_name as driver_name,
    d.phone as driver_phone,
    d.avatar_url as driver_avatar_url,
    b.vehicle_type,
    b.distance_miles,
    COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
    ROUND(COALESCE(b.final_price_cents, b.estimated_price_cents, 0) / 100.0, 2) as price_dollars,
    'USD' as currency,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN passengers p ON p.id = b.passenger_id
  LEFT JOIN drivers d ON d.id = b.driver_id
  ORDER BY b.created_at DESC
  LIMIT 100;
END;
$$;

-- 3. System settings function (replaces v_system_settings view)
CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS TABLE(
  key text,
  smartprice_enabled boolean,
  smartprice_markup_cents integer,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow authenticated users to read system settings
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    s.key,
    s.smartprice_enabled,
    s.smartprice_markup_cents,
    s.updated_at
  FROM app_settings s
  LIMIT 1;
END;
$$;

-- 4. Passenger dashboard cards function
CREATE OR REPLACE FUNCTION public.get_passenger_dashboard_cards()
RETURNS TABLE(
  booking_id uuid,
  booking_code text,
  status text,
  passenger_id uuid,
  passenger_name text,
  passenger_avatar_url text,
  driver_id uuid,
  driver_name text,
  driver_avatar_url text,
  pickup_location text,
  dropoff_location text,
  pickup_time timestamptz,
  distance_miles numeric,
  price_cents integer,
  price_dollars numeric,
  currency text,
  vehicle_type text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Verify user authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.booking_code,
    b.status,
    b.passenger_id,
    COALESCE(b.passenger_first_name || ' ' || b.passenger_last_name, p.full_name, '') as passenger_name,
    COALESCE(b.passenger_photo_url, p.profile_photo_url) as passenger_avatar_url,
    b.driver_id,
    d.full_name as driver_name,
    d.avatar_url as driver_avatar_url,
    b.pickup_location,
    b.dropoff_location,
    b.pickup_time,
    b.distance_miles,
    COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
    ROUND(COALESCE(b.final_price_cents, b.estimated_price_cents, 0) / 100.0, 2) as price_dollars,
    'USD' as currency,
    b.vehicle_type,
    b.created_at,
    b.updated_at
  FROM bookings b
  LEFT JOIN passengers p ON p.id = b.passenger_id
  LEFT JOIN drivers d ON d.id = b.driver_id
  WHERE p.user_id = current_user_id
  ORDER BY b.created_at DESC
  LIMIT 50;
END;
$$;

-- 5. Driver list function for dispatchers (replaces dispatcher_drivers_min)
CREATE OR REPLACE FUNCTION public.get_dispatcher_drivers()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone text,
  photo_url text,
  car_make text,
  car_model text,
  car_year text,
  car_color text,
  license_plate text
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
    d.id,
    d.full_name,
    d.email,
    d.phone,
    d.avatar_url as photo_url,
    d.car_make,
    d.car_model,
    d.car_year,
    d.car_color,
    d.license_plate
  FROM drivers d
  WHERE d.status = 'active'
  ORDER BY d.full_name;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_my_passenger_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dispatcher_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_system_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_passenger_dashboard_cards() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dispatcher_drivers() TO authenticated;