-- Fix the sync_passenger_data function to use correct column names
CREATE OR REPLACE FUNCTION public.sync_passenger_data()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  update bookings
  set 
    passenger_first = split_part(p.full_name, ' ', 1),
    passenger_last = substring(p.full_name from position(' ' in p.full_name) + 1),
    passenger_phc = p.phone,
    passenger_phc2 = p.profile_photo_url,
    passenger_pre = jsonb_build_object(
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