
import { supabase } from "@/integrations/supabase/client";

export type PassengerPreferences = {
  air_conditioning: boolean | null;
  preferred_temperature: number | null;
  temperature_unit: 'F' | 'C' | null;
  radio_on: boolean | null;
  preferred_music: string | null;
  conversation_preference: 'No Preference' | 'Quiet' | 'Chatty' | null;
  trip_purpose: 'Leisure' | 'Business' | null;
  trip_notes: string | null;
};

export async function getMyPassengerPreferences(): Promise<PassengerPreferences | null> {
  const { data, error } = await supabase.rpc('get_my_passenger_preferences');
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}

export async function upsertMyPassengerPreferences(input: PassengerPreferences): Promise<void> {
  const { error } = await supabase.rpc('upsert_my_passenger_preferences', {
    _air_conditioning: input.air_conditioning,
    _preferred_temperature: input.preferred_temperature,
    _temperature_unit: input.temperature_unit,
    _radio_on: input.radio_on,
    _preferred_music: input.preferred_music,
    _conversation_preference: input.conversation_preference,
    _trip_purpose: input.trip_purpose,
    _trip_notes: input.trip_notes
  });
  
  if (error) {
    throw new Error(error.message);
  }
}
