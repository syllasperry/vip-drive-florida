-- Fix Security Definer View issues by adding proper authorization checks to functions

-- Fix dispatcher_list_bookings functions to require dispatcher authorization
CREATE OR REPLACE FUNCTION public.dispatcher_list_bookings()
 RETURNS TABLE(booking_id uuid, booking_code text, status booking_sync_status, passenger_id uuid, passenger_name text, passenger_avatar_url text, passenger_phone text, driver_id uuid, driver_name text, driver_avatar_url text, driver_phone text, vehicle_type text, distance_miles numeric, price_cents integer, price_dollars numeric, currency text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Check if user is authorized as dispatcher
  SELECT
    v.booking_id,
    v.booking_code,
    v.status,
    v.passenger_id,
    v.passenger_name,
    v.passenger_avatar_url,
    v.passenger_phone,
    v.driver_id,
    v.driver_name,
    v.driver_avatar_url,
    v.driver_phone,
    v.vehicle_type,
    v.distance_miles,
    v.price_cents,
    v.price_dollars,
    v.currency,
    v.created_at,
    v.updated_at
  FROM public.dispatcher_bookings_cards_v2 v
  WHERE EXISTS (
    SELECT 1 FROM public.dispatchers d 
    WHERE lower(d.email) = lower(coalesce(current_setting('request.jwt.claim.email', true), ''))
  )
  ORDER BY v.created_at DESC;
$function$;

-- Remove SECURITY DEFINER from functions that don't need elevated privileges
CREATE OR REPLACE FUNCTION public.is_dispatcher()
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.dispatchers d
    WHERE lower(d.email) = lower((auth.jwt() ->> 'email'))
  );
$function$;

-- Create a secure version for email parameter that requires proper authorization
CREATE OR REPLACE FUNCTION public.is_dispatcher_email(p_email text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  -- Only allow checking if current user is a dispatcher or the email matches current user
  SELECT CASE 
    WHEN lower(p_email) = lower(coalesce(current_setting('request.jwt.claim.email', true), '')) THEN
      EXISTS (SELECT 1 FROM public.dispatchers d WHERE lower(d.email) = lower(p_email))
    WHEN EXISTS (SELECT 1 FROM public.dispatchers d WHERE lower(d.email) = lower(coalesce(current_setting('request.jwt.claim.email', true), ''))) THEN
      EXISTS (SELECT 1 FROM public.dispatchers d WHERE lower(d.email) = lower(p_email))
    ELSE false
  END;
$function$;

-- Fix get_published_reviews to ensure it only returns published reviews (remove SECURITY DEFINER as it's not needed)
CREATE OR REPLACE FUNCTION public.get_published_reviews(limit_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, passenger_name text, passenger_photo_url text, public_review text, overall_rating integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    p.full_name as passenger_name,
    p.profile_photo_url as passenger_photo_url,
    r.public_review,
    r.overall_rating,
    r.created_at
  FROM public.ride_reviews r
  JOIN public.passengers p ON p.id = r.passenger_id
  WHERE r.is_published = true
    AND r.consent_for_public_use = true
    AND r.overall_rating = 5
    AND r.public_review IS NOT NULL
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$function$;