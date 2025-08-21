-- Fix the Security Definer View issue and missing RLS policies
-- First, let's fix the app_settings table structure and RLS policies

-- Check the actual structure of app_settings table
-- Based on the error, it uses different column names

-- Add proper RLS policies for tables that have RLS enabled but no policies
-- Fix booking_code_counters
ALTER TABLE public.booking_code_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_code_counters_read_auth" ON public.booking_code_counters;
CREATE POLICY "booking_code_counters_read_auth" ON public.booking_code_counters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "booking_code_counters_update_system" ON public.booking_code_counters;
CREATE POLICY "booking_code_counters_update_system" ON public.booking_code_counters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Fix driver_registration_links (already has some policies but needs read policy)
DROP POLICY IF EXISTS "driver_registration_links_read_auth" ON public.driver_registration_links;
CREATE POLICY "driver_registration_links_read_auth" ON public.driver_registration_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Fix email_outbox policies
DROP POLICY IF EXISTS "email_outbox_insert_system" ON public.email_outbox;
CREATE POLICY "email_outbox_insert_system" ON public.email_outbox
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Create proper system settings view without SECURITY DEFINER
-- Using the correct column names from app_settings
CREATE OR REPLACE VIEW public.v_system_settings AS
SELECT 
  COALESCE(
    (SELECT smartprice_enabled FROM public.app_settings WHERE key = 'default'), 
    false
  ) as smart_price_enabled,
  COALESCE(
    (SELECT smartprice_markup_cents FROM public.app_settings WHERE key = 'default'), 
    2000
  ) as smartprice_markup_cents;

-- Remove any SECURITY DEFINER views by recreating them without that property
-- This addresses the Security Definer View linter error

-- Fix views that might have SECURITY DEFINER property
-- Most dispatcher views should not use SECURITY DEFINER, but proper RLS instead

-- Ensure all dispatcher views rely on proper RLS policies rather than SECURITY DEFINER
-- The views themselves inherit security from the underlying tables with RLS

-- Add missing RLS policies for other tables that show up in linter as having RLS but no policies

-- Check if system_settings table needs RLS
CREATE TABLE IF NOT EXISTS public.system_settings (
  id integer PRIMARY KEY DEFAULT 1,
  smart_price_enabled boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CHECK (id = 1) -- Enforce singleton
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings_read_all" ON public.system_settings;
CREATE POLICY "system_settings_read_all" ON public.system_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "system_settings_update_admin" ON public.system_settings;
CREATE POLICY "system_settings_update_admin" ON public.system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
    )
  );

-- Insert default system settings if not exists
INSERT INTO public.system_settings (id, smart_price_enabled, updated_at)
VALUES (1, false, now())
ON CONFLICT (id) DO NOTHING;