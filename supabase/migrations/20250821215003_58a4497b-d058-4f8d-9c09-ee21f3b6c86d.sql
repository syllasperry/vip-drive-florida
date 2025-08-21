
-- Fix RLS policies for booking_code_counters to allow booking creation
-- The table needs to be accessible for generating booking codes during booking creation

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "booking_code_counters_read_auth" ON public.booking_code_counters;
DROP POLICY IF EXISTS "booking_code_counters_update_system" ON public.booking_code_counters;

-- Create new policies that allow booking code generation during booking creation
CREATE POLICY "booking_code_counters_read_authenticated" 
ON public.booking_code_counters 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "booking_code_counters_insert_authenticated" 
ON public.booking_code_counters 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "booking_code_counters_update_authenticated" 
ON public.booking_code_counters 
FOR UPDATE 
TO authenticated 
USING (true);

-- Ensure the table has proper setup for booking code generation
-- Insert initial row for current year if it doesn't exist
INSERT INTO public.booking_code_counters (year, last_value)
VALUES (EXTRACT(YEAR FROM NOW())::integer, 0)
ON CONFLICT (year) DO NOTHING;
