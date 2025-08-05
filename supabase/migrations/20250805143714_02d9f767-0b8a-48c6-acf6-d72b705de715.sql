-- Fix remaining functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_booking_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.ride_status != OLD.ride_status THEN
    NEW.updated_at = now();
  END IF;
  
  IF NEW.payment_confirmation_status != OLD.payment_confirmation_status THEN
    NEW.updated_at = now();
    
    -- Set passenger payment confirmation timestamp
    IF NEW.payment_confirmation_status = 'passenger_paid' AND OLD.payment_confirmation_status != 'passenger_paid' THEN
      NEW.passenger_payment_confirmed_at = now();
    END IF;
    
    -- Set driver payment confirmation timestamp  
    IF NEW.payment_confirmation_status = 'all_set' AND OLD.payment_confirmation_status != 'all_set' THEN
      NEW.driver_payment_confirmed_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_ride_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  driver_info RECORD;
  passenger_info RECORD;
  notification_body TEXT;
  stage_display TEXT;
BEGIN
  -- Only proceed if ride_stage actually changed
  IF NEW.ride_stage = OLD.ride_stage THEN
    RETURN NEW;
  END IF;
  
  -- Get driver and passenger info
  SELECT full_name, id INTO driver_info FROM drivers WHERE id = NEW.driver_id;
  SELECT full_name, id INTO passenger_info FROM passengers WHERE id = NEW.passenger_id;
  
  -- Map ride stages to display text and notifications
  CASE NEW.ride_stage
    WHEN 'driver_heading_to_pickup' THEN
      stage_display := 'Driver Heading to Pickup';
      notification_body := 'Your driver is on the way to pick you up';
    WHEN 'driver_arrived_at_pickup' THEN
      stage_display := 'Driver Arrived at Pickup';
      notification_body := 'Your driver has arrived at the pickup location';
    WHEN 'passenger_onboard' THEN
      stage_display := 'Passenger Onboard';
      notification_body := 'Passenger is in the vehicle, ride starting';
    WHEN 'in_transit' THEN
      stage_display := 'In Transit';
      notification_body := 'Your ride is currently in progress';
    WHEN 'driver_arrived_at_dropoff' THEN
      stage_display := 'Driver Arrived at Drop-off';
      notification_body := 'Driver has arrived at the destination';
    WHEN 'completed' THEN
      stage_display := 'Ride Completed';
      notification_body := 'Your ride has been completed. Please rate your experience!';
    ELSE
      stage_display := 'Status Updated';
      notification_body := 'Your ride status has been updated';
  END CASE;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_passenger_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  update bookings
  set 
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
  from passengers p
  where bookings.passenger_id = p.id
    and bookings.id = NEW.id;

  return NEW;
end;
$function$;