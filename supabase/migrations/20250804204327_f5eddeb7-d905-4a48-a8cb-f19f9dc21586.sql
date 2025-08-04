-- Fix the sync_passenger_data function to use correct bookings table column names
CREATE OR REPLACE FUNCTION public.sync_passenger_data()
RETURNS trigger
LANGUAGE plpgsql
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