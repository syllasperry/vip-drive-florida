-- Phase 2: Fix Security Definer Views (Fixed Version)

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

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.get_my_passenger_bookings();
DROP FUNCTION IF EXISTS public.get_dispatcher_dashboard_data();
DROP FUNCTION IF EXISTS public.get_system_settings();
DROP FUNCTION IF EXISTS public.get_passenger_dashboard_cards();
DROP FUNCTION IF EXISTS public.get_dispatcher_drivers();

-- Create secure replacement functions with proper access control

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

-- 2. Secure system settings access (no longer a view)
CREATE OR REPLACE FUNCTION public.get_app_settings()
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
  -- Allow authenticated users to read app settings
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_my_passenger_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_app_settings() TO authenticated;