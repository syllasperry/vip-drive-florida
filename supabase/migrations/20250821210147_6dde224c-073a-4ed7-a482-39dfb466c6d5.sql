-- Comprehensive fix for Security Definer Views
-- This migration identifies and recreates all security definer views

DO $$
DECLARE
    view_record RECORD;
    view_def TEXT;
    clean_def TEXT;
BEGIN
    -- Find all views that might have security definer property
    FOR view_record IN
        SELECT n.nspname as schema_name, 
               c.relname as view_name,
               pg_get_viewdef(c.oid, true) as view_definition
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'v' 
        AND n.nspname = 'public'
    LOOP
        view_def := view_record.view_definition;
        
        -- Check if view definition contains SECURITY DEFINER in any case variation
        IF view_def ~* 'SECURITY\s+DEFINER' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.%', view_record.schema_name, view_record.view_name;
            
            -- Clean the definition by removing SECURITY DEFINER
            clean_def := regexp_replace(view_def, '\s*SECURITY\s+DEFINER\s*', '', 'gi');
            
            -- Drop the existing view
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.schema_name, view_record.view_name);
            
            -- Recreate without SECURITY DEFINER
            EXECUTE format('CREATE VIEW %I.%I AS %s', view_record.schema_name, view_record.view_name, clean_def);
            
            RAISE NOTICE 'Recreated view %.% without SECURITY DEFINER', view_record.schema_name, view_record.view_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed security definer view cleanup';
END $$;

-- Enable RLS on tables that don't have it enabled
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_catalog.pg_tables t
            JOIN pg_catalog.pg_class c ON c.relname = t.tablename
            WHERE t.schemaname = 'public' 
            AND c.relrowsecurity = true
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', table_record.schemaname, table_record.tablename);
            RAISE NOTICE 'Enabled RLS on table %.%', table_record.schemaname, table_record.tablename;
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not enable RLS on %.%: %', table_record.schemaname, table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;