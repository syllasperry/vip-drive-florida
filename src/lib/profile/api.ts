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

export async function getMyProfile(): Promise<PassengerProfile | null> {
  try {
    const { data, error } = await supabase.rpc('get_my_passenger_profile');
    if (error) {
      console.error('getMyProfile RPC error:', error);
      return null;
    }
    return data ?? null;
  } catch (error) {
    console.error('getMyProfile unexpected error:', error);
    return null;
  }
}

export async function saveMyProfile(input: {
  full_name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
}): Promise<PassengerProfile | null> {
  try {
    const { full_name, email, phone, avatarUrl } = input;
    const { data, error } = await supabase.rpc('upsert_my_passenger_profile', {
      _first_name: full_name || '',
      _last_name: '', // Using full_name for both first and last for simplicity
      _phone: phone || '',
      _email: email || ''
    });
    
    if (error) {
      console.error('saveMyProfile RPC error:', error);
      throw error;
    }
    
    // Handle avatar upload separately if provided
    if (avatarUrl && avatarUrl.startsWith('blob:')) {
      // This is a blob URL, we need to upload it
      // For now, we'll return the profile without avatar
      console.log('Avatar upload not implemented in this version');
    }
    
    return data ?? null;
  } catch (error) {
    console.error('saveMyProfile unexpected error:', error);
    throw error;
  }
}