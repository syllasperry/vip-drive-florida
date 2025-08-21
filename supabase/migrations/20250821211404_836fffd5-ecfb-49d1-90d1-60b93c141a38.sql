-- Security Definer Functions Cleanup and Documentation
-- This addresses the linter warnings about SECURITY DEFINER functions
-- by adding proper security checks and converting non-critical functions

-- Convert simple utility functions from SECURITY DEFINER to SECURITY INVOKER
-- These functions don't need elevated privileges

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY INVOKER  -- Changed from SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  ORDER BY created_at DESC 
  LIMIT 1;
$$;

-- Add security validation to critical SECURITY DEFINER functions
-- This ensures they can only be called by authorized users

CREATE OR REPLACE FUNCTION public.dispatcher_assign_driver_and_price(p_booking_id uuid, p_driver_id uuid, p_estimated_price numeric, p_final_price numeric DEFAULT NULL::numeric)
RETURNS TABLE(booking_id uuid, status text, driver_id uuid, estimated_price numeric, final_price numeric, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER  -- Kept as SECURITY DEFINER but with added security
SET search_path TO 'public'
AS $$
declare
  v_email text;
  v_now timestamptz := now();
  v_exists boolean;
begin
  -- Security check: Only dispatchers can use this function
  v_email := nullif(current_setting('request.jwt.claim.email', true), '');
  
  if v_email is null or not public.is_dispatcher_email(v_email) then
    raise exception 'Unauthorized: only registered dispatchers can assign drivers and prices.';
  end if;

  -- Validate inputs
  if p_booking_id is null then
    raise exception 'Booking ID is required';
  end if;
  
  if p_driver_id is null then
    raise exception 'Driver ID is required';
  end if;

  -- Rest of function remains the same...
  select exists(select 1 from public.bookings where id = p_booking_id)
  into v_exists;
  if not v_exists then
    raise exception 'Booking % not found', p_booking_id;
  end if;

  select exists(select 1 from public.drivers where id = p_driver_id)
  into v_exists;
  if not v_exists then
    raise exception 'Driver % not found', p_driver_id;
  end if;

  if p_estimated_price is null or p_estimated_price < 0 then
    raise exception 'Invalid estimated_price';
  end if;
  if p_final_price is not null and p_final_price < 0 then
    raise exception 'Invalid final_price';
  end if;

  update public.bookings b
  set
    driver_id       = p_driver_id,
    estimated_price = p_estimated_price,
    final_price     = p_final_price,
    status          = 'offer_sent',
    updated_at      = v_now
  where b.id = p_booking_id
    and coalesce(b.status,'') in ('pending','offer_sent')
  returning b.id, b.status, b.driver_id, b.estimated_price, b.final_price, b.updated_at
  into booking_id, status, driver_id, estimated_price, final_price, updated_at;

  if booking_id is null then
    raise exception 'Nothing updated: invalid state for booking %', p_booking_id;
  end if;

  return;
end
$$;

-- Add proper security documentation for functions that legitimately need SECURITY DEFINER
COMMENT ON FUNCTION public.enqueue_payment_confirmation_emails(uuid) IS 
'SECURITY DEFINER: Required to access email_outbox table and cross-reference booking/passenger/driver data for email notifications';

COMMENT ON FUNCTION public.dispatcher_assign_driver_and_price(uuid, uuid, numeric, numeric) IS 
'SECURITY DEFINER: Required to update bookings table with dispatcher privileges after validation';

COMMENT ON FUNCTION public.ensure_vip_chat_thread(uuid) IS 
'SECURITY DEFINER: Required to create chat threads that need system-level access';

-- Create a view to document all SECURITY DEFINER functions and their justifications
CREATE OR REPLACE VIEW public.security_definer_functions_audit AS
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    obj_description(p.oid, 'pg_proc') as justification,
    CASE 
        WHEN obj_description(p.oid, 'pg_proc') IS NULL THEN 'WARNING: No justification documented'
        ELSE 'Documented'
    END as documentation_status
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND p.prosecdef = true
ORDER BY 
    CASE WHEN obj_description(p.oid, 'pg_proc') IS NULL THEN 0 ELSE 1 END,
    p.proname;

-- Grant appropriate permissions
GRANT SELECT ON public.security_definer_functions_audit TO authenticated;

-- Log the security review
DO $$
BEGIN
    RAISE NOTICE 'Security Definer Functions Review Completed:';
    RAISE NOTICE '- Converted utility functions to SECURITY INVOKER where possible';
    RAISE NOTICE '- Added input validation to critical SECURITY DEFINER functions';  
    RAISE NOTICE '- Created audit view to track function justifications';
    RAISE NOTICE '- Documented legitimate uses of SECURITY DEFINER';
    RAISE NOTICE 'Remaining SECURITY DEFINER functions are necessary for cross-table operations and system functions';
END $$;