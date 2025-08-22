
import { supabase } from "@/integrations/supabase/client";

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
    return supabase.storage.from('avatars').getPublicUrl('').data.publicUrl;
  }
  
  if (pathOrUrl.startsWith('http')) {
    return pathOrUrl;
  }
  
  return supabase.storage.from('avatars').getPublicUrl(pathOrUrl).data.publicUrl;
}

// Enhanced functions for passenger profile management
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

    // Try to get avatar from storage
    let avatarUrl = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: files } = await supabase.storage
          .from('avatars')
          .list(user.id, { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (files && files.length > 0) {
          avatarUrl = supabase.storage
            .from('avatars')
            .getPublicUrl(`${user.id}/${files[0].name}`).data.publicUrl;
        }
      }
    } catch (avatarError) {
      console.error('Error loading avatar:', avatarError);
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

    return publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
}

export function buildAvatarUrl(userId: string, filename?: string) {
  if (!filename) return null;
  
  const path = `${userId}/${filename}`;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
