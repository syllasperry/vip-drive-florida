-- Add missing columns to bookings table if needed
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS luggage_size TEXT;