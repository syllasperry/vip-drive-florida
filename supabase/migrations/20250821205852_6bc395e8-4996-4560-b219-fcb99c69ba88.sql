-- Fix Security Definer Views
-- This migration converts SECURITY DEFINER views to SECURITY INVOKER (default)
-- to ensure they respect RLS policies of the querying user

-- Drop and recreate views without SECURITY DEFINER
-- These views should use the permissions of the querying user, not the creator

-- First, let's check what views exist and recreate them properly
DO $$
DECLARE
    view_record RECORD;
    view_definition TEXT;
BEGIN
    -- Get all views in public schema that might have SECURITY DEFINER
    FOR view_record IN 
        SELECT schemaname, viewname, definition
        FROM pg_views 
        WHERE schemaname = 'public'
        ORDER BY viewname
    LOOP
        -- Check if the view definition contains SECURITY DEFINER
        IF view_record.definition ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.%', view_record.schemaname, view_record.viewname;
            
            -- Get the clean definition without SECURITY DEFINER
            view_definition := REPLACE(view_record.definition, 'SECURITY DEFINER', '');
            view_definition := REPLACE(view_definition, 'security definer', '');
            
            -- Drop and recreate the view without SECURITY DEFINER
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schemaname, view_record.viewname);
            EXECUTE format('CREATE VIEW %I.%I AS %s', view_record.schemaname, view_record.viewname, view_definition);
            
            RAISE NOTICE 'Recreated view %.% without SECURITY DEFINER', view_record.schemaname, view_record.viewname;
        END IF;
    END LOOP;
END $$;

-- Enable RLS on any tables that these views access to ensure proper security
-- Most tables should already have RLS enabled, but let's make sure

-- Add RLS policies for views that need to access data based on user permissions
-- These policies ensure that even if a view was previously SECURITY DEFINER,
-- it now respects user permissions properly

-- For dispatcher views - only allow access to dispatchers
CREATE POLICY IF NOT EXISTS "dispatcher_views_access" ON bookings
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  )
  OR passenger_id = auth.uid() 
  OR driver_id = auth.uid()
);

-- Ensure passengers table has proper RLS for profile access
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "passengers_own_profile" ON passengers
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure drivers table has proper RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions for views to work with RLS
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;