-- Add vehicle_id foreign key to bookings table to properly link with vehicles
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id);

-- Update the bookings table to have a proper relationship with vehicles
-- This will allow us to fetch vehicle details including model names

-- Create an index for better performance when joining bookings with vehicles
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON public.bookings(vehicle_id);

-- Also create index for driver queries
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON public.bookings(passenger_id);