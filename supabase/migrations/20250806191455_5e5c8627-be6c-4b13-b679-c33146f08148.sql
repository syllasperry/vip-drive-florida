-- Add metadata column to booking_status_history table
ALTER TABLE public.booking_status_history 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;