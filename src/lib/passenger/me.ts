
import { supabase } from '@/integrations/supabase/client';

export interface PassengerMe {
  full_name: string;
  profile_photo_url?: string | null;
}

export async function fetchMyPassengerProfile(): Promise<PassengerMe | null> {
  try {
    console.log('🔍 Fetching passenger profile from passengers table...');
    
    const { data, error } = await supabase
      .from('passengers')
      .select('full_name, profile_photo_url')
      .eq('user_id', supabase.auth.getUser().then(({ data: { user } }) => user?.id))
      .maybeSingle();

    if (error) {
      console.warn('⚠️ Error fetching passenger profile:', error);
      return null;
    }

    if (!data) {
      console.warn('⚠️ No passenger profile found for current user');
      return null;
    }

    console.log('✅ Successfully fetched passenger profile:', data);
    return {
      full_name: data.full_name || '',
      profile_photo_url: data.profile_photo_url
    };
  } catch (error) {
    console.warn('⚠️ Unexpected error fetching passenger profile:', error);
    return null;
  }
}
