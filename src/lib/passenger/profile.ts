
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

import { supabase } from '@/integrations/supabase/client';

export async function fetchMyPassengerProfile(): Promise<PassengerProfile | null> {
  try {
    const { data, error } = await supabase.rpc('get_my_passenger_profile');
    if (error) {
      console.error('[fetchMyPassengerProfile] RPC error', error);
      return null;
    }
    return data ?? null;
  } catch (error) {
    console.error('[fetchMyPassengerProfile] unexpected error', error);
    return null;
  }
}

export async function saveMyPassengerProfile(params: {
  fullName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}): Promise<PassengerProfile | null> {
  try {
    const { data, error } = await supabase.rpc('upsert_my_passenger_profile', {
      _full_name: params.fullName || '',
      _last_name: '', // Using full_name for simplicity
      _phone: params.phone || '',
      _email: '' // Will be handled by auth
    });
    
    if (error) {
      console.error('[saveMyPassengerProfile] RPC error', error);
      throw error;
    }
    
    // Handle avatar upload separately if provided
    if (params.avatarUrl && params.avatarUrl.startsWith('blob:')) {
      console.log('Avatar upload not implemented in this version');
    }
    
    return data ?? null;
  } catch (error) {
    console.error('[saveMyPassengerProfile] unexpected error', error);
    throw error;
  }
}
