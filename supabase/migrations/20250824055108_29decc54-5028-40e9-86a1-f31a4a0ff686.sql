-- First, identify all views with SECURITY DEFINER
SELECT 
  schemaname, 
  viewname,
  substring(definition from 1 for 200) as definition_preview
FROM pg_views 
WHERE schemaname = 'public' 
  AND definition ILIKE '%security definer%'
ORDER BY viewname;

-- Fix security definer views by recreating them WITHOUT SECURITY DEFINER
-- These are likely the problematic views based on the table structure

-- Drop and recreate v_system_settings without SECURITY DEFINER
DROP VIEW IF EXISTS public.v_system_settings;
CREATE VIEW public.v_system_settings AS
SELECT 
  COALESCE(smart_price_enabled, false) as smart_price_enabled,
  COALESCE(smart_price_markup_cents, 2000) as smart_price_markup_cents,
  updated_at
FROM public.system_settings
LIMIT 1;

-- Enable RLS on system_settings if not already enabled
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for system_settings
CREATE POLICY "Allow authenticated read system_settings" 
  ON public.system_settings 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Create a function to normalize vehicle categories safely
CREATE OR REPLACE FUNCTION public._normalize_vehicle_category(vehicle_type text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  CASE 
    WHEN lower(vehicle_type) LIKE '%luxury%' OR lower(vehicle_type) LIKE '%premium%' THEN
      RETURN 'luxury';
    WHEN lower(vehicle_type) LIKE '%suv%' OR lower(vehicle_type) LIKE '%suburban%' THEN
      RETURN 'suv';
    WHEN lower(vehicle_type) LIKE '%van%' OR lower(vehicle_type) LIKE '%minivan%' THEN
      RETURN 'van';
    ELSE
      RETURN 'sedan';
  END CASE;
END;
$$;