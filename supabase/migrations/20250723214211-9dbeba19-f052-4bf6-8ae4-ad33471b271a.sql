-- Create passengers table
CREATE TABLE public.passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  profile_photo_url TEXT,
  license_plate TEXT,
  car_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Drop existing bookings table and recreate with new structure
DROP TABLE IF EXISTS public.bookings CASCADE;

-- Create bookings table with new structure
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for passengers
CREATE POLICY "Passengers can view their own data"
ON public.passengers FOR SELECT
USING (auth.uid()::text = id::text);

CREATE POLICY "Passengers can update their own data"
ON public.passengers FOR UPDATE
USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create passenger account"
ON public.passengers FOR INSERT
WITH CHECK (true);

-- Create RLS policies for drivers
CREATE POLICY "Drivers can view their own data"
ON public.drivers FOR SELECT
USING (auth.uid()::text = id::text);

CREATE POLICY "Drivers can update their own data"
ON public.drivers FOR UPDATE
USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can create driver account"
ON public.drivers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Drivers can view all drivers"
ON public.drivers FOR SELECT
USING (true);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their bookings"
ON public.bookings FOR SELECT
USING (
  auth.uid()::text = passenger_id::text OR 
  auth.uid()::text = driver_id::text
);

CREATE POLICY "Passengers can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid()::text = passenger_id::text);

CREATE POLICY "Drivers can update their bookings"
ON public.bookings FOR UPDATE
USING (auth.uid()::text = driver_id::text);

CREATE POLICY "Passengers can update their bookings"
ON public.bookings FOR UPDATE
USING (auth.uid()::text = passenger_id::text);

-- Create RLS policies for reviews
CREATE POLICY "Users can view reviews"
ON public.reviews FOR SELECT
USING (
  auth.uid()::text = passenger_id::text OR 
  auth.uid()::text = driver_id::text
);

CREATE POLICY "Passengers can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid()::text = passenger_id::text);

-- Create indexes for better performance
CREATE INDEX idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_reviews_booking_id ON public.reviews(booking_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;