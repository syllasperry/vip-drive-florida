-- Fix Security Definer Views by removing SECURITY DEFINER property
-- and adding proper RLS policies instead

-- First, identify and fix views with SECURITY DEFINER
-- Based on the linter output, we need to check which views have this property

-- Check current views with SECURITY DEFINER
DO $$
DECLARE
    view_record RECORD;
    view_def TEXT;
BEGIN
    -- Loop through all views in public schema to find SECURITY DEFINER ones
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Get the view definition
        SELECT pg_get_viewdef(view_record.viewname::regclass, true) INTO view_def;
        
        -- Check if it contains SECURITY DEFINER
        IF view_def ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.%', view_record.schemaname, view_record.viewname;
            
            -- Drop and recreate view without SECURITY DEFINER
            -- Note: This is a template - actual implementation would need specific view definitions
            EXECUTE format('-- View %I.%I has SECURITY DEFINER - needs manual fix', 
                         view_record.schemaname, view_record.viewname);
        END IF;
    END LOOP;
END $$;

-- Common security definer views that need to be fixed:
-- Instead of SECURITY DEFINER views, we'll use proper RLS policies

-- Fix dispatcher views to use proper RLS instead of SECURITY DEFINER
-- Add proper RLS policies for dispatcher-related views

-- Example fix for dispatcher_full_bookings if it has SECURITY DEFINER:
-- This would need to be customized based on actual view definitions

CREATE OR REPLACE VIEW public.v_system_settings AS
SELECT 
  COALESCE(
    (SELECT value::boolean FROM public.app_settings WHERE key = 'smartprice_enabled'), 
    false
  ) as smart_price_enabled,
  COALESCE(
    (SELECT value::integer FROM public.app_settings WHERE key = 'smartprice_markup_cents'), 
    2000
  ) as smartprice_markup_cents;

-- Enable RLS on the view if needed
-- Note: Views inherit RLS from underlying tables

-- Ensure proper RLS policies exist for the underlying tables
-- that these views depend on

-- Add specific RLS policy for app_settings if not exists
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_read_all" ON public.app_settings;
CREATE POLICY "app_settings_read_all" ON public.app_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "app_settings_update_auth" ON public.app_settings;  
CREATE POLICY "app_settings_update_auth" ON public.app_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Add missing RLS policies for tables that have RLS enabled but no policies
-- Based on the linter warnings

-- Fix booking_code_counters
ALTER TABLE public.booking_code_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "booking_code_counters_read_auth" ON public.booking_code_counters
  FOR SELECT USING (true);

CREATE POLICY "booking_code_counters_update_system" ON public.booking_code_counters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Fix driver_registration_links
CREATE POLICY "driver_registration_links_read_auth" ON public.driver_registration_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Fix email_outbox policies
CREATE POLICY "email_outbox_insert_system" ON public.email_outbox
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Document that manual review of specific SECURITY DEFINER views is needed
-- The exact views would need to be identified and recreated without SECURITY DEFINER