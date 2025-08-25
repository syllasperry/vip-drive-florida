
-- Fix the trip_purpose check constraint to allow all six required values
ALTER TABLE public.passenger_preferences 
DROP CONSTRAINT IF EXISTS passenger_preferences_trip_purpose_check;

-- Add the corrected constraint with all six valid values
ALTER TABLE public.passenger_preferences 
ADD CONSTRAINT passenger_preferences_trip_purpose_check 
CHECK (trip_purpose IN ('business', 'leisure', 'airport', 'events', 'medical', 'other'));
