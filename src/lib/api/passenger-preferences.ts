
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
    // Log the user authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error('Authentication failed');
    }
    
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    console.log('Authenticated user:', user.id);
    console.log('Original preferences:', preferences);

    // Map the conversation preference values to match database constraints
    const mappedConversationPreference = mapConversationPreference(preferences.conversation_preference);
    console.log('Mapped conversation preference:', mappedConversationPreference);
    
    const rpcParams = {
      _air_conditioning: preferences.air_conditioning,
      _preferred_temperature: preferences.preferred_temperature,
      _temperature_unit: preferences.temperature_unit,
      _radio_on: preferences.radio_on,
      _preferred_music: preferences.preferred_music,
      _conversation_preference: mappedConversationPreference,
      _trip_purpose: preferences.trip_purpose,
      _trip_notes: preferences.trip_notes
    };
    
    console.log('RPC parameters:', rpcParams);

    const { data, error } = await supabase.rpc('upsert_my_passenger_preferences', rpcParams);

    if (error) {
      console.error('Supabase RPC error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Successfully saved preferences, RPC response:', data);
  } catch (error) {
    console.error('Unexpected error saving passenger preferences:', error);
    throw error;
  }
}

// Map conversation preference values to match database constraints
function mapConversationPreference(value: string): string {
  const mapping: { [key: string]: string } = {
    'friendly': 'chatty',
    'quiet': 'prefers_silence', 
    'no_preference': 'depends',
    'chatty': 'chatty',
    'prefers_silence': 'prefers_silence',
    'depends': 'depends'
  };
  
  console.log('Mapping conversation preference:', value, 'to:', mapping[value] || 'depends');
  return mapping[value] || 'depends';
}

export async function getPassengerPreferences(): Promise<PassengerPreferences | null> {
  try {
    console.log('Fetching passenger preferences...');
    
    const { data, error } = await supabase.rpc('get_my_passenger_preferences');

    if (error) {
      console.error('Error getting passenger preferences:', error);
      return null;
    }

    console.log('Retrieved preferences data:', data);

    if (!data || data.length === 0) {
      console.log('No preferences found for user');
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
