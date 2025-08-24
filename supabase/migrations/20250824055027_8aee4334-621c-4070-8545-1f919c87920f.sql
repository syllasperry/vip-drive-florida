-- Fix parameter name in is_dispatcher_email function
CREATE OR REPLACE FUNCTION public.is_dispatcher_email(p_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dispatchers d
    JOIN public.user_roles ur ON ur.user_id = d.user_id
    WHERE lower(d.email) = lower(p_email)
    AND ur.role = 'dispatcher'::app_role
  );
$$;

-- Query to identify security definer views that need to be fixed
-- First, let's see what views exist
SELECT 
  schemaname, 
  viewname, 
  definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%'
ORDER BY viewname;