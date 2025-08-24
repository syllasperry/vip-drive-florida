-- Fix the security definer views with correct column names and handle missing system_settings data
-- First check if we need to create system_settings table or add missing columns

-- Create system_settings table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_price_enabled boolean DEFAULT false,
  smart_price_markup_cents integer DEFAULT 2000,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Add missing column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'system_settings' 
                   AND column_name = 'smart_price_markup_cents' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.system_settings ADD COLUMN smart_price_markup_cents integer DEFAULT 2000;
    END IF;
END $$;

-- Insert default settings if table is empty
INSERT INTO public.system_settings (smart_price_enabled, smart_price_markup_cents)
SELECT false, 2000
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- Now fix the security definer views
DROP VIEW IF EXISTS public.v_system_settings CASCADE;
DROP VIEW IF EXISTS public.v_booking_pricing_preview CASCADE;

-- Recreate v_system_settings without SECURITY DEFINER
CREATE VIEW public.v_system_settings AS
SELECT 
  COALESCE(smart_price_enabled, false) as smart_price_enabled,
  COALESCE(smart_price_markup_cents, 2000) as smart_price_markup_cents,
  updated_at
FROM public.system_settings
LIMIT 1;

-- Recreate v_booking_pricing_preview without SECURITY DEFINER  
CREATE VIEW public.v_booking_pricing_preview AS
SELECT 
  b.id as booking_id,
  b.vehicle_type,
  b.distance_miles,
  s.smart_price_enabled,
  s.smart_price_markup_cents,
  CASE 
    WHEN b.final_price_cents IS NOT NULL THEN b.final_price_cents
    WHEN b.estimated_price_cents IS NOT NULL THEN b.estimated_price_cents
    ELSE NULL
  END as price_cents
FROM public.bookings b
CROSS JOIN public.v_system_settings s;