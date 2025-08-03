-- Add new ride status values and update existing schema
-- First, add new columns to bookings for detailed ride tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS ride_stage TEXT DEFAULT 'driver_heading_to_pickup',
ADD COLUMN IF NOT EXISTS driver_location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS driver_location_lng NUMERIC,
ADD COLUMN IF NOT EXISTS extra_stops JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ride_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ride_completed_at TIMESTAMP WITH TIME ZONE;

-- Create reviews table with detailed rating categories
CREATE TABLE IF NOT EXISTS public.ride_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  driving_rating INTEGER NOT NULL CHECK (driving_rating >= 1 AND driving_rating <= 5),
  comfort_rating INTEGER NOT NULL CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  overall_rating NUMERIC GENERATED ALWAYS AS (
    (communication_rating + punctuality_rating + driving_rating + comfort_rating) / 4.0
  ) STORED,
  public_review TEXT,
  private_feedback TEXT,
  is_published BOOLEAN DEFAULT false,
  auto_publish_eligible BOOLEAN GENERATED ALWAYS AS (
    communication_rating = 5 AND 
    punctuality_rating = 5 AND 
    driving_rating = 5 AND 
    comfort_rating = 5 AND 
    LENGTH(TRIM(public_review)) > 10
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reviews table
ALTER TABLE public.ride_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews table
CREATE POLICY "Passengers can create reviews for their rides" 
ON public.ride_reviews 
FOR INSERT 
WITH CHECK (
  auth.uid()::text = passenger_id::text AND
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND passenger_id = auth.uid()
    AND (status = 'completed' OR ride_status = 'completed')
  )
);

CREATE POLICY "Users can view reviews for their rides" 
ON public.ride_reviews 
FOR SELECT 
USING (
  auth.uid()::text = passenger_id::text OR 
  auth.uid()::text = driver_id::text
);

CREATE POLICY "Published reviews are viewable by everyone" 
ON public.ride_reviews 
FOR SELECT 
USING (is_published = true);

-- Create trigger for automatic timestamp updates on reviews
CREATE TRIGGER update_ride_reviews_updated_at
BEFORE UPDATE ON public.ride_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-publish eligible reviews
CREATE OR REPLACE FUNCTION public.auto_publish_eligible_reviews()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-publish if eligible (all 5-star ratings and good public review)
  IF NEW.auto_publish_eligible = true THEN
    NEW.is_published = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-publishing
CREATE TRIGGER auto_publish_review_trigger
BEFORE INSERT OR UPDATE ON public.ride_reviews
FOR EACH ROW
EXECUTE FUNCTION public.auto_publish_eligible_reviews();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ride_reviews_booking_id ON public.ride_reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_ride_reviews_published ON public.ride_reviews(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_bookings_ride_stage ON public.bookings(ride_stage);

-- Update existing ride status values to be more descriptive
UPDATE public.bookings 
SET ride_stage = CASE 
  WHEN ride_status = 'pending_driver' THEN 'pending_driver'
  WHEN ride_status = 'accepted' OR payment_confirmation_status = 'all_set' THEN 'driver_heading_to_pickup'
  WHEN ride_status = 'in_progress' THEN 'in_transit'
  WHEN ride_status = 'completed' THEN 'completed'
  ELSE 'driver_heading_to_pickup'
END
WHERE ride_stage IS NULL OR ride_stage = 'driver_heading_to_pickup';