-- ==========================================
-- 🔒 Fix remaining function search path security warnings
-- ==========================================

-- Fix sync_passenger_data function
CREATE OR REPLACE FUNCTION public.sync_passenger_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.bookings
  SET 
    passenger_first_name = split_part(p.full_name, ' ', 1),
    passenger_last_name = substring(p.full_name from position(' ' in p.full_name) + 1),
    passenger_phone = p.phone,
    passenger_photo_url = p.profile_photo_url,
    passenger_preferences = jsonb_build_object(
      'temperature', p.preferred_temperature,
      'music', p.music_preference,
      'interaction', p.interaction_preference,
      'trip_purpose', p.trip_purpose,
      'notes', p.additional_notes
    )
  FROM public.passengers p
  WHERE public.bookings.passenger_id = p.id
    AND public.bookings.id = NEW.id;

  RETURN NEW;
END;
$$;

-- Fix update_timeline_status function  
CREATE OR REPLACE FUNCTION public.update_timeline_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Update driver status based on latest driver action
  IF NEW.status_driver != OLD.status_driver OR NEW.ride_status != OLD.ride_status OR NEW.ride_stage != OLD.ride_stage THEN
    NEW.driver_status = CASE 
      WHEN NEW.ride_status = 'driver_accepted' OR NEW.status_driver = 'driver_accepted' THEN 'Driver Accepted'
      WHEN NEW.ride_status = 'offer_sent' THEN 'Offer Sent'
      WHEN NEW.ride_status = 'driver_rejected' OR NEW.status_driver = 'driver_rejected' THEN 'Driver Declined'
      WHEN NEW.ride_stage = 'driver_heading_to_pickup' THEN 'Heading to Pickup'
      WHEN NEW.ride_stage = 'driver_arrived_at_pickup' THEN 'Arrived at Pickup'
      WHEN NEW.ride_stage = 'passenger_onboard' THEN 'Passenger Onboard'
      WHEN NEW.ride_stage = 'in_transit' THEN 'In Transit'
      WHEN NEW.ride_stage = 'completed' THEN 'Ride Completed'
      ELSE COALESCE(NEW.driver_status, 'Pending Response')
    END;
  END IF;

  -- Update passenger status based on latest passenger action or next required step
  IF NEW.status_passenger != OLD.status_passenger OR NEW.payment_confirmation_status != OLD.payment_confirmation_status OR NEW.ride_stage != OLD.ride_stage THEN
    NEW.passenger_status = CASE 
      WHEN NEW.payment_confirmation_status = 'all_set' THEN 'All Set'
      WHEN NEW.payment_confirmation_status = 'passenger_paid' OR NEW.status_passenger = 'payment_confirmed' THEN 'Payment Confirmed'
      WHEN NEW.status_passenger = 'passenger_requested' THEN 'Ride Requested'
      WHEN NEW.ride_status = 'driver_accepted' AND NEW.payment_confirmation_status = 'waiting_for_offer' THEN 'Waiting for Payment'
      WHEN NEW.ride_status = 'offer_sent' THEN 'Review Offer'
      WHEN NEW.ride_stage = 'driver_heading_to_pickup' THEN 'Driver En Route'
      WHEN NEW.ride_stage = 'driver_arrived_at_pickup' THEN 'Driver Arrived'
      WHEN NEW.ride_stage = 'passenger_onboard' THEN 'Ride Started'
      WHEN NEW.ride_stage = 'in_transit' THEN 'In Transit'
      WHEN NEW.ride_stage = 'completed' THEN 'Ride Completed'
      ELSE COALESCE(NEW.passenger_status, 'Waiting for Driver')
    END;
  END IF;

  RETURN NEW;
END;
$$;