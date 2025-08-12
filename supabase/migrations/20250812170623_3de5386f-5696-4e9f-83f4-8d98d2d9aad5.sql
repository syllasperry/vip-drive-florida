
-- Fix the trigger function to properly cast text to booking_status enum
CREATE OR REPLACE FUNCTION public.track_status_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO ride_status_history 
        (booking_id, previous_status, new_status, changed_by)
        VALUES 
        (NEW.id, OLD.status::booking_status, NEW.status::booking_status, auth.uid());
    END IF;
    RETURN NEW;
END;
$function$
