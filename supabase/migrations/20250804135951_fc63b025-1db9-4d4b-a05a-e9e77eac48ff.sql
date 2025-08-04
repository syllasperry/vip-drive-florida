-- Clear any automatically set ride_stage values from existing bookings
-- These should only be set when driver manually selects a stage
UPDATE public.bookings 
SET ride_stage = NULL, updated_at = now()
WHERE ride_stage IS NOT NULL;