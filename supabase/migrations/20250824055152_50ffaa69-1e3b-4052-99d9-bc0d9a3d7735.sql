-- Fix security definer views with CASCADE to handle dependencies
DROP VIEW IF EXISTS public.v_system_settings CASCADE;
DROP VIEW IF EXISTS public.v_booking_pricing_preview CASCADE;

-- Recreate v_system_settings without SECURITY DEFINER
CREATE VIEW public.v_system_settings AS
SELECT 
  COALESCE(smart_price_enabled, false) as smart_price_enabled,
  COALESCE(smart_price_markup_cents, 2000) as smart_price_markup_cents,
  updated_at
FROM public.system_settings
LIMIT 1;

-- Recreate dependent views without SECURITY DEFINER
CREATE VIEW public.v_booking_pricing_preview AS
SELECT 
  b.id as booking_id,
  b.vehicle_type,
  b.distance_miles,
  s.smart_price_enabled,
  s.smart_price_markup_cents,
  CASE 
    WHEN b.final_price_cents IS NOT NULL THEN b.final_price_cents
    WHEN b.estimated_price_cents IS NOT NULL THEN b.estimated_price_cents
    ELSE NULL
  END as price_cents
FROM public.bookings b
CROSS JOIN public.v_system_settings s;