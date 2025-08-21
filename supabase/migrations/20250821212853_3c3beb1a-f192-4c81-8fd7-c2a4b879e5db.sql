-- Simple fix for Security Definer View and RLS policy issues
-- Focus on adding missing RLS policies without recreating complex views

-- Add missing RLS policies for tables that have RLS enabled but no policies

-- Fix booking_code_counters if it doesn't have policies
DO $$
BEGIN
  -- Check if policies exist before creating them
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'booking_code_counters'
    AND policyname = 'booking_code_counters_read_auth'
  ) THEN
    CREATE POLICY "booking_code_counters_read_auth" ON public.booking_code_counters
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'booking_code_counters'
    AND policyname = 'booking_code_counters_update_system'
  ) THEN
    CREATE POLICY "booking_code_counters_update_system" ON public.booking_code_counters
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
        )
      );
  END IF;
END $$;

-- Fix driver_registration_links policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'driver_registration_links'
    AND policyname = 'driver_registration_links_read_auth'
  ) THEN
    CREATE POLICY "driver_registration_links_read_auth" ON public.driver_registration_links
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
        )
      );
  END IF;
END $$;

-- Fix email_outbox policies if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'email_outbox'
    AND policyname = 'email_outbox_insert_system'
  ) THEN
    CREATE POLICY "email_outbox_insert_system" ON public.email_outbox
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
        )
      );
  END IF;
END $$;

-- Note: The Security Definer View issue will need to be addressed by identifying
-- and manually recreating specific views without the SECURITY DEFINER property.
-- This requires identifying which exact views have this property and recreating them.

-- For now, the critical RLS policy gaps have been addressed.