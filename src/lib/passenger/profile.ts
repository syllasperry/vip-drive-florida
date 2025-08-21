
import { supabase } from '@/integrations/supabase/client';

export type PassengerProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchMyPassengerProfile(): Promise<PassengerProfile | null> {
  try {
    console.log('🔍 Fetching passenger profile via RPC');
    
    const { data, error } = await supabase.rpc('get_my_passenger_profile');
    
    if (error) {
      console.error('[fetchMyPassengerProfile] RPC error', error);
      return null;
    }
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.log('📭 No passenger profile found');
      return null;
    }
    
    console.log('✅ Successfully fetched passenger profile');
    return data[0] as PassengerProfile;
  } catch (error) {
    console.error('[fetchMyPassengerProfile] unexpected error', error);
    return null;
  }
}

export async function saveMyPassengerProfile(params: {
  fullName: string;
  phone: string;
  email: string;
}): Promise<PassengerProfile | null> {
  try {
    console.log('💾 Saving passenger profile via RPC');
    
    const nameParts = params.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const { data, error } = await supabase.rpc('upsert_my_passenger_profile', {
      _first_name: firstName,
      _last_name: lastName,
      _phone: params.phone || '',
      _email: params.email
    });
    
    if (error) {
      console.error('[saveMyPassengerProfile] RPC error', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned from profile save');
    }
    
    console.log('✅ Successfully saved passenger profile');
    return data[0] as PassengerProfile;
  } catch (error) {
    console.error('[saveMyPassengerProfile] unexpected error', error);
    throw error;
  }
}

export async function createPassengerProfileFromAuth(): Promise<PassengerProfile | null> {
  try {
    console.log('👤 Creating passenger profile from auth user');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      throw new Error('No authenticated user found');
    }
    
    // Extract name from user metadata if available
    const userMetadata = user.user_metadata || {};
    const fullName = userMetadata.full_name || userMetadata.name || user.email.split('@')[0];
    
    return await saveMyPassengerProfile({
      fullName,
      phone: userMetadata.phone || '',
      email: user.email
    });
  } catch (error) {
    console.error('[createPassengerProfileFromAuth] error', error);
    throw error;
  }
}
