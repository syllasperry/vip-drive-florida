-- Enable realtime for bookings table
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add bookings table to realtime publication
SELECT pg_publish_insert_into_table('supabase_realtime', 'bookings');
SELECT pg_publish_update_into_table('supabase_realtime', 'bookings');

-- Create trigger function to send push notifications on ride stage updates
CREATE OR REPLACE FUNCTION public.notify_ride_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  driver_info RECORD;
  passenger_info RECORD;
  notification_title TEXT;
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
  
  -- Send push notification to passenger (they need to know about status changes)
  IF passenger_info.id IS NOT NULL THEN
    PERFORM net.http_post(
      url := 'https://extdyjkfgftbokabiamc.supabase.co/functions/v1/send-booking-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.headers')::json->>'authorization' || '"}',
      body := json_build_object(
        'type', 'ride_status_update',
        'userId', passenger_info.id,
        'userType', 'passenger',
        'bookingId', NEW.id,
        'title', 'VIP Drive',
        'body', notification_body,
        'data', json_build_object(
          'bookingId', NEW.id,
          'rideStage', NEW.ride_stage,
          'stageDisplay', stage_display,
          'timestamp', NOW()
        )
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for ride status notifications
DROP TRIGGER IF EXISTS trigger_ride_status_notifications ON public.bookings;
CREATE TRIGGER trigger_ride_status_notifications
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.ride_stage IS DISTINCT FROM NEW.ride_stage)
  EXECUTE FUNCTION public.notify_ride_status_change();