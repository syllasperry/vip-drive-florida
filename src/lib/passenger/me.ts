
import { supabase } from '@/integrations/supabase/client';

export interface PassengerMe {
  full_name: string;
  profile_photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function fetchMyPassengerProfile(): Promise<PassengerMe | null> {
  try {
    console.log('🔍 Fetching passenger profile from passengers table...');
    
    const { data, error } = await supabase.rpc('get_my_passenger_profile');

    if (error) {
      console.warn('⚠️ Error fetching passenger profile:', error);
      return null;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn('⚠️ No passenger profile found');
      return null;
    }

    const profile = data[0];
    console.log('✅ Successfully fetched passenger profile:', profile);
    
    return {
      full_name: profile.full_name || '',
      profile_photo_url: profile.profile_photo_url,
      email: profile.email,
      phone: profile.phone
    };
  } catch (error) {
    console.warn('⚠️ Unexpected error fetching passenger profile:', error);
    return null;
  }
}
