-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION find_matching_drivers(
  p_vehicle_make TEXT,
  p_vehicle_model TEXT
) RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  driver_email TEXT,
  driver_phone TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;