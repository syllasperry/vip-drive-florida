
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

    // Validate and map values to match database constraints
    const mappedPreferences = {
      _air_conditioning: preferences.air_conditioning,
      _preferred_temperature: Math.max(60, Math.min(85, preferences.preferred_temperature)),
      _temperature_unit: preferences.temperature_unit,
      _radio_on: preferences.radio_on,
      _preferred_music: mapMusicPreference(preferences.preferred_music, preferences.radio_on),
      _conversation_preference: mapConversationPreference(preferences.conversation_preference),
      _trip_purpose: mapTripPurpose(preferences.trip_purpose),
      _trip_notes: preferences.trip_notes || ''
    };
    
    console.log('Mapped RPC parameters:', mappedPreferences);

    const { data, error } = await supabase.rpc('upsert_my_passenger_preferences', mappedPreferences);

    if (error) {
      console.error('Supabase RPC error:', error);
      
      // Provide specific error messages based on constraint violations
      if (error.message?.includes('preferred_temperature_check')) {
        throw new Error('Temperature must be between 60°F and 85°F');
      }
      if (error.message?.includes('preferred_music_check')) {
        throw new Error('Invalid music preference selected');
      }
      if (error.message?.includes('conversation_preference_check')) {
        throw new Error('Invalid conversation preference selected');
      }
      if (error.message?.includes('trip_purpose_check')) {
        throw new Error('Invalid trip purpose selected');
      }
      
      throw new Error(`Failed to save preferences: ${error.message}`);
    }

    console.log('Successfully saved preferences');
    return data;
  } catch (error) {
    console.error('Error saving passenger preferences:', error);
    throw error;
  }
}

// Map music preference values to database enum
function mapMusicPreference(value: string, radioOn: boolean): string {
  // If radio is off, always return 'off'
  if (!radioOn) {
    return 'off';
  }
  
  const mapping: { [key: string]: string } = {
    'no_preference': 'no_preference',
    'classical': 'classical',
    'jazz': 'jazz',
    'pop': 'pop',
    'rock': 'rock',
    'electronic': 'electronic',
    'off': 'off'
  };
  
  return mapping[value] || 'no_preference';
}

// Map conversation preference values to database enum
function mapConversationPreference(value: string): string {
  const mapping: { [key: string]: string } = {
    'friendly': 'chatty',
    'chatty': 'chatty',
    'quiet': 'prefers_silence',
    'prefers_silence': 'prefers_silence',
    'no_preference': 'depends',
    'depends': 'depends'
  };
  
  return mapping[value] || 'depends';
}

// Map trip purpose values to database enum
function mapTripPurpose(value: string): string {
  const mapping: { [key: string]: string } = {
    'business': 'business',
    'leisure': 'leisure',
    'airport': 'airport',
    'event': 'events',
    'events': 'events',
    'medical': 'medical',
    'other': 'other',
    'work': 'business' // Map common alternative
  };
  
  return mapping[value] || 'other';
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
