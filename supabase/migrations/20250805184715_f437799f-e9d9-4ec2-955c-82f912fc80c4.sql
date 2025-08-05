-- Fix search path for security definer functions
DROP FUNCTION public.get_ride_status_summary(UUID);
DROP FUNCTION public.get_ride_timeline(UUID);

-- Create function to get latest status for each actor with secure search path
CREATE OR REPLACE FUNCTION public.get_ride_status_summary(p_ride_id UUID)
RETURNS TABLE(
    actor_role TEXT,
    status_code TEXT,
    status_label TEXT,
    status_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (rs.actor_role)
        rs.actor_role,
        rs.status_code,
        rs.status_label,
        rs.status_timestamp,
        rs.metadata
    FROM public.ride_status rs
    WHERE rs.ride_id = p_ride_id
    ORDER BY rs.actor_role, rs.status_timestamp DESC;
END;
$$;

-- Create function to get complete ride timeline with secure search path
CREATE OR REPLACE FUNCTION public.get_ride_timeline(p_ride_id UUID)
RETURNS TABLE(
    status_code TEXT,
    status_label TEXT,
    actor_role TEXT,
    status_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        rs.status_code,
        rs.status_label,
        rs.actor_role,
        rs.status_timestamp,
        rs.metadata
    FROM public.ride_status rs
    WHERE rs.ride_id = p_ride_id
    ORDER BY rs.status_timestamp ASC;
END;
$$;