-- Add account type and name fields to drivers table
ALTER TABLE public.drivers 
ADD COLUMN account_type text CHECK (account_type IN ('individual', 'business')),
ADD COLUMN account_name text;

-- Add account type and name fields to passengers table  
ALTER TABLE public.passengers
ADD COLUMN account_type text CHECK (account_type IN ('individual', 'business')),
ADD COLUMN account_name text;