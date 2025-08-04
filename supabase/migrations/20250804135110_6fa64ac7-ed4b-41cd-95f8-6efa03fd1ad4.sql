-- Remove the automatic default value for ride_stage
-- This was causing status to show automatically instead of only when driver selects it
ALTER TABLE public.bookings ALTER COLUMN ride_stage DROP DEFAULT;