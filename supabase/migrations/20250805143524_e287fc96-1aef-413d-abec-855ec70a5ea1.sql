-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION auto_sync_to_all_set()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When both passenger confirms payment and driver accepts, set all_set
  IF NEW.status_passenger = 'payment_confirmed' AND NEW.status_driver = 'driver_accepted' THEN
    NEW.status_passenger = 'all_set';
    NEW.status_driver = 'all_set';
    NEW.ride_status = 'all_set';
    NEW.payment_confirmation_status = 'all_set';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing functions to fix search_path warnings
CREATE OR REPLACE FUNCTION public.find_matching_drivers(p_vehicle_make text, p_vehicle_model text)
 RETURNS TABLE(driver_id uuid, driver_name text, driver_email text, driver_phone text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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