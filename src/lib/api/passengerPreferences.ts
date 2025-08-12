
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
    // Direct table query since RPC might not be available
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('passenger_preferences')
      .select('*')
      .eq('user_id', user.user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user has no preferences yet
        return null;
      }
      throw new Error(error.message);
    }
    
    return {
      air_conditioning: data.air_conditioning,
      preferred_temperature: data.preferred_temperature,
      temperature_unit: data.temperature_unit,
      radio_on: data.radio_on,
      preferred_music: data.preferred_music,
      conversation_preference: data.conversation_preference,
      trip_purpose: data.trip_purpose,
      trip_notes: data.trip_notes
    };
  } catch (error) {
    console.error('Error fetching passenger preferences:', error);
    return null;
  }
}

export async function upsertMyPassengerPreferences(input: PassengerPreferences): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user?.id) {
      throw new Error('User not authenticated');
    }
    
    const { error } = await supabase
      .from('passenger_preferences')
      .upsert({
        user_id: user.user.id,
        air_conditioning: input.air_conditioning,
        preferred_temperature: input.preferred_temperature,
        temperature_unit: input.temperature_unit,
        radio_on: input.radio_on,
        preferred_music: input.preferred_music,
        conversation_preference: input.conversation_preference,
        trip_purpose: input.trip_purpose,
        trip_notes: input.trip_notes
      });
    
    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Error upserting passenger preferences:', error);
    throw error;
  }
}
