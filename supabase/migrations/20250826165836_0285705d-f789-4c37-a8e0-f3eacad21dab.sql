-- Phase 3: Fix Function Search Path Security Issues

-- Update all existing functions to have secure search paths
-- This prevents search path injection attacks

-- Update existing functions with SET search_path = public
CREATE OR REPLACE FUNCTION public.is_user_dispatcher(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid AND email = 'syllasperry@gmail.com'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_owns_driver_record(driver_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN driver_uuid = user_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_publish_eligible_reviews()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Auto-publish if eligible (all 5-star ratings and good public review)
  IF NEW.auto_publish_eligible = true THEN
    NEW.is_published = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_driver_in_bookings(driver_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings b1
    JOIN bookings b2 ON b1.passenger_id = b2.passenger_id
    WHERE b1.driver_id = driver_uuid AND b2.driver_id = user_uuid
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.schedule_review_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only schedule if booking has a pickup_time and is completed or all_set
  IF NEW.pickup_time IS NOT NULL AND 
     (NEW.payment_confirmation_status = 'all_set' OR NEW.ride_status = 'completed') THEN
    
    INSERT INTO public.review_notifications (
      booking_id,
      passenger_id,
      scheduled_for
    ) VALUES (
      NEW.id,
      NEW.passenger_id,
      NEW.pickup_time + INTERVAL '2 hours'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_driver_registration_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_matching_drivers(p_vehicle_make text, p_vehicle_model text)
RETURNS TABLE(driver_id uuid, driver_name text, driver_email text, driver_phone text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    d.email,
    d.phone
  FROM drivers d
  WHERE 
    LOWER(TRIM(d.car_make)) = LOWER(TRIM(p_vehicle_make))
    AND LOWER(TRIM(d.car_model)) = LOWER(TRIM(p_vehicle_model))
    AND d.car_make IS NOT NULL 
    AND d.car_model IS NOT NULL
    AND d.car_make != ''
    AND d.car_model != '';
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_dispatcher_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Only sync when driver_id changes from NULL to a value (manual assignment)
  IF OLD.driver_id IS NULL AND NEW.driver_id IS NOT NULL THEN
    -- Set initial status for manual dispatcher assignment
    NEW.status = 'assigned';
    NEW.ride_status = 'assigned_by_dispatcher';
    NEW.payment_confirmation_status = 'waiting_for_offer';
    NEW.status_driver = 'assigned';
    NEW.status_passenger = 'driver_assigned';
  END IF;
  
  -- Sync status when offer is sent (final_price is set)
  IF NEW.final_price IS NOT NULL AND (OLD.final_price IS NULL OR OLD.final_price != NEW.final_price) THEN
    NEW.status = 'offer_sent';
    NEW.ride_status = 'offer_sent';
    NEW.payment_confirmation_status = 'price_awaiting_acceptance';
    NEW.status_driver = 'offer_sent';
    NEW.status_passenger = 'review_offer';
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_assigned_driver(driver_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM bookings
    WHERE driver_id = driver_uuid AND passenger_id = user_uuid
  );
END;
$function$;