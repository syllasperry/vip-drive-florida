-- ==========================================
-- 🔒 Fix last function search path security warning
-- ==========================================

-- Fix notify_ride_status_change function
CREATE OR REPLACE FUNCTION public.notify_ride_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
  SELECT full_name, id INTO driver_info FROM public.drivers WHERE id = NEW.driver_id;
  SELECT full_name, id INTO passenger_info FROM public.passengers WHERE id = NEW.passenger_id;
  
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
$$;