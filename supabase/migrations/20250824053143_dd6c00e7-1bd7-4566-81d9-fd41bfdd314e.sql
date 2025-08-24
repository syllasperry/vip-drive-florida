
-- Create reviews table
CREATE TABLE IF NOT EXISTS public.ride_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL,
  driver_id uuid,
  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  driving_rating integer CHECK (driving_rating >= 1 AND driving_rating <= 5),
  comfort_rating integer CHECK (comfort_rating >= 1 AND comfort_rating <= 5),
  public_review text,
  private_feedback text,
  consent_for_public_use boolean DEFAULT false,
  auto_publish_eligible boolean GENERATED ALWAYS AS (
    overall_rating = 5 AND 
    communication_rating = 5 AND 
    punctuality_rating = 5 AND 
    driving_rating = 5 AND 
    comfort_rating = 5 AND
    public_review IS NOT NULL AND 
    LENGTH(TRIM(public_review)) > 10
  ) STORED,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ride_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Passengers can view their own reviews" 
  ON public.ride_reviews 
  FOR SELECT 
  USING (
    passenger_id IN (
      SELECT p.id FROM public.passengers p WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Passengers can create reviews for their bookings" 
  ON public.ride_reviews 
  FOR INSERT 
  WITH CHECK (
    passenger_id IN (
      SELECT p.id FROM public.passengers p WHERE p.user_id = auth.uid()
    )
    AND booking_id IN (
      SELECT b.id FROM public.bookings b 
      JOIN public.passengers p ON p.id = b.passenger_id 
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view published reviews" 
  ON public.ride_reviews 
  FOR SELECT 
  USING (is_published = true);

-- Create review notifications table
CREATE TABLE IF NOT EXISTS public.review_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  review_submitted boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for review notifications
ALTER TABLE public.review_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their review notifications" 
  ON public.review_notifications 
  FOR SELECT 
  USING (
    passenger_id IN (
      SELECT p.id FROM public.passengers p WHERE p.user_id = auth.uid()
    )
  );

-- Create function to schedule review notifications
CREATE OR REPLACE FUNCTION schedule_review_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only schedule if booking has a pickup_time and is completed or all_set
  IF NEW.pickup_time IS NOT NULL AND 
     (NEW.payment_confirmation_status = 'all_set' OR NEW.ride_status = 'completed') THEN
    
    INSERT INTO public.review_notifications (
      booking_id,
      passenger_id,
      scheduled_for
    ) VALUES (
      NEW.id,
      NEW.passenger_id,
      NEW.pickup_time + INTERVAL '2 hours'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-schedule review notifications
DROP TRIGGER IF EXISTS trigger_schedule_review_notification ON public.bookings;
CREATE TRIGGER trigger_schedule_review_notification
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION schedule_review_notification();

-- Add trigger for auto-publishing eligible reviews
CREATE TRIGGER trigger_auto_publish_reviews
  BEFORE INSERT OR UPDATE ON public.ride_reviews
  FOR EACH ROW
  EXECUTE FUNCTION auto_publish_eligible_reviews();

-- Create function to get published reviews for carousel
CREATE OR REPLACE FUNCTION get_published_reviews(limit_count integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  passenger_name text,
  passenger_photo_url text,
  public_review text,
  overall_rating integer,
  created_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    p.full_name as passenger_name,
    p.profile_photo_url as passenger_photo_url,
    r.public_review,
    r.overall_rating,
    r.created_at
  FROM public.ride_reviews r
  JOIN public.passengers p ON p.id = r.passenger_id
  WHERE r.is_published = true
    AND r.consent_for_public_use = true
    AND r.overall_rating = 5
    AND r.public_review IS NOT NULL
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
