
import { supabase } from '@/integrations/supabase/client';

export interface PassengerPreferences {
  air_conditioning: boolean;
  preferred_temperature: number;
  temperature_unit: string;
  radio_on: boolean;
  preferred_music: string;
  conversation_preference: string;
  trip_purpose: string;
  trip_notes: string;
}

export async function savePassengerPreferences(preferences: PassengerPreferences) {
  try {
    const { error } = await supabase.rpc('upsert_my_passenger_preferences', {
      _air_conditioning: preferences.air_conditioning,
      _preferred_temperature: preferences.preferred_temperature,
      _temperature_unit: preferences.temperature_unit,
      _radio_on: preferences.radio_on,
      _preferred_music: preferences.preferred_music,
      _conversation_preference: preferences.conversation_preference,
      _trip_purpose: preferences.trip_purpose,
      _trip_notes: preferences.trip_notes
    });

    if (error) {
      console.error('Error saving passenger preferences:', error);
      throw error;
    }
  } catch (error) {
    console.error('Unexpected error saving passenger preferences:', error);
    throw error;
  }
}

export async function getPassengerPreferences(): Promise<PassengerPreferences | null> {
  try {
    const { data, error } = await supabase.rpc('get_my_passenger_preferences');

    if (error) {
      console.error('Error getting passenger preferences:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Unexpected error getting passenger preferences:', error);
    return null;
  }
}

export async function uploadPassengerAvatar(file: File): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update passenger profile with new avatar URL
    await supabase
      .from('passengers')
      .update({ profile_photo_url: publicUrl })
      .eq('user_id', user.id);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading passenger avatar:", error);
    throw error;
  }
}
