import { supabase } from "@/integrations/supabase/client";

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

export async function uploadAvatar(file: File) {
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
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

export async function getMyPassengerProfile() {
  try {
    const { data, error } = await supabase.rpc('get_my_passenger_profile');

    if (error) {
      console.error("Error fetching my passenger profile:", error);
      return {
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        avatarUrl: null
      };
    }

    const profile = data && Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    if (!profile) {
      return {
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        avatarUrl: null
      };
    }

    // Get current user to check for avatar
    const { data: { user } } = await supabase.auth.getUser();
    let avatarUrl = profile.profile_photo_url;

    // If no avatar in profile but user exists, check storage
    if (!avatarUrl && user?.id) {
      try {
        const { data: files } = await supabase.storage
          .from('avatars')
          .list(user.id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (files && files.length > 0) {
          avatarUrl = supabase.storage
            .from('avatars')
            .getPublicUrl(`${user.id}/${files[0].name}`).data.publicUrl;
        }
      } catch (avatarError) {
        console.error('Error loading avatar:', avatarError);
      }
    }

    return {
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      avatarUrl
    };
  } catch (error) {
    console.error("Unexpected error fetching my passenger profile:", error);
    return {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      avatarUrl: null
    };
  }
}

export async function upsertMyPassengerProfile(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}) {
  try {
    // First, ensure we have a passenger profile with full_name
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    // Create or update passenger with full_name to avoid NOT NULL constraint
    const fullName = `${input.first_name.trim()} ${input.last_name.trim()}`.trim();
    
    const { data: passengerData, error: passengerError } = await supabase
      .from('passengers')
      .upsert({
        user_id: user.id,
        full_name: fullName || 'User', // Ensure full_name is never empty
        email: input.email,
        phone: input.phone
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (passengerError) {
      console.error("Error upserting passenger:", passengerError);
      throw passengerError;
    }

    // Now use the RPC function
    const { data, error } = await supabase.rpc('upsert_my_passenger_profile', {
      _first_name: input.first_name,
      _last_name: input.last_name,
      _phone: input.phone,
      _email: input.email
    });

    if (error) {
      console.error("Error in RPC upsert_my_passenger_profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error upserting passenger profile:", error);
    throw error;
  }
}

export async function getPassengerDriverProfile(bookingId: string) {
  try {
    const { data, error } = await supabase.rpc('passenger_driver_profile', { 
      _booking_id: bookingId 
    });

    if (error) {
      console.error("Error fetching passenger driver profile:", error);
      return null;
    }

    return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Unexpected error fetching passenger driver profile:", error);
    return null;
  }
}

export async function getDispatcherPassengerProfile(bookingId: string) {
  try {
    const { data, error } = await supabase.rpc('dispatcher_booking_passenger_details', { 
      b_id: bookingId 
    });

    if (error) {
      console.error("Error fetching dispatcher passenger profile:", error);
      return null;
    }

    return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Unexpected error fetching dispatcher passenger profile:", error);
    return null;
  }
}

export function publicAvatarUrl(pathOrUrl?: string) {
  if (!pathOrUrl) {
    return null;
  }
  
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }
  
  return supabase.storage.from('avatars').getPublicUrl(pathOrUrl).data.publicUrl;
}

export function buildAvatarUrl(userId: string, filename?: string) {
  if (!filename) return null;
  
  const path = `${userId}/${filename}`;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
