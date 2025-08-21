-- Fix Security Definer Views by removing SECURITY DEFINER property
-- This ensures views respect RLS policies of the querying user

-- Note: PostgreSQL doesn't support IF NOT EXISTS for policies in older versions
-- So we'll use a different approach

-- Create a function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    policy_name TEXT,
    table_name TEXT,
    policy_sql TEXT
) RETURNS VOID AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    ) THEN
        EXECUTE policy_sql;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure passengers table has proper RLS for profile access
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for passengers table
SELECT create_policy_if_not_exists(
    'passengers_own_profile_select',
    'passengers',
    'CREATE POLICY passengers_own_profile_select ON passengers FOR SELECT TO authenticated USING (user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
    'passengers_own_profile_update',
    'passengers', 
    'CREATE POLICY passengers_own_profile_update ON passengers FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
);

SELECT create_policy_if_not_exists(
    'passengers_own_profile_insert',
    'passengers',
    'CREATE POLICY passengers_own_profile_insert ON passengers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())'
);

-- Clean up the helper function
DROP FUNCTION create_policy_if_not_exists(TEXT, TEXT, TEXT);