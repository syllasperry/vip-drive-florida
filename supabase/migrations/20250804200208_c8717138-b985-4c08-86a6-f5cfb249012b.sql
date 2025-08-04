-- Add passenger data fields to bookings table for denormalization
ALTER TABLE public.bookings 
ADD COLUMN passenger_first_name TEXT,
ADD COLUMN passenger_last_name TEXT,
ADD COLUMN passenger_phone TEXT,
ADD COLUMN passenger_photo_url TEXT,
ADD COLUMN passenger_preferences JSONB;