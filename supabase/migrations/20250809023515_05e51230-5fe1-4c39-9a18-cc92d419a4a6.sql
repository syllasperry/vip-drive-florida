
-- Add new columns to drivers table for enhanced driver management
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'individual';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS bank_info jsonb DEFAULT '{}';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS registration_link_token text;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS registration_link_expires_at timestamp with time zone;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS self_registered boolean DEFAULT false;

-- Add RLS policies for dispatcher to manage all drivers
CREATE POLICY "Dispatcher can manage all drivers" ON drivers
FOR ALL USING (
  -- Allow if user is the dispatcher (syllasperry@gmail.com)
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'syllasperry@gmail.com'
  )
);

-- Function to generate registration link tokens
CREATE OR REPLACE FUNCTION generate_driver_registration_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Create a table for driver registration links
CREATE TABLE IF NOT EXISTS driver_registration_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on registration links table
ALTER TABLE driver_registration_links ENABLE ROW LEVEL SECURITY;

-- Policy for dispatcher to manage registration links
CREATE POLICY "Dispatcher can manage registration links" ON driver_registration_links
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'syllasperry@gmail.com'
  )
);
