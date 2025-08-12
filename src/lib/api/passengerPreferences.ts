
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
  try {
    // First try the RPC function
    const { data, error } = await supabase.rpc('get_my_passenger_preferences');
    
    if (error) {
      console.warn('RPC get_my_passenger_preferences not available, falling back to direct query');
      
      // Fallback to direct table query
      const { data: directData, error: directError } = await supabase
        .from('passenger_preferences')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (directError) {
        if (directError.code === 'PGRST116') {
          // No rows returned - user has no preferences yet
          return null;
        }
        throw new Error(directError.message);
      }
      
      return directData as PassengerPreferences;
    }
    
    return data as PassengerPreferences;
  } catch (error) {
    console.error('Error fetching passenger preferences:', error);
    return null;
  }
}

export async function upsertMyPassengerPreferences(input: PassengerPreferences): Promise<void> {
  try {
    // First try the RPC function
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
      console.warn('RPC upsert_my_passenger_preferences not available, falling back to direct upsert');
      
      // Fallback to direct table upsert
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { error: directError } = await supabase
        .from('passenger_preferences')
        .upsert({
          user_id: user.data.user.id,
          air_conditioning: input.air_conditioning,
          preferred_temperature: input.preferred_temperature,
          temperature_unit: input.temperature_unit,
          radio_on: input.radio_on,
          preferred_music: input.preferred_music,
          conversation_preference: input.conversation_preference,
          trip_purpose: input.trip_purpose,
          trip_notes: input.trip_notes
        });
      
      if (directError) {
        throw new Error(directError.message);
      }
    }
  } catch (error) {
    console.error('Error upserting passenger preferences:', error);
    throw error;
  }
}
