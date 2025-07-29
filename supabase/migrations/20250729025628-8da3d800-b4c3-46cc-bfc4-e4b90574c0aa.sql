-- Add new columns for pricing and payment flow
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS estimated_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method TEXT;