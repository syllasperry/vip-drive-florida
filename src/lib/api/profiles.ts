
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

// New functions for passenger profile management
export async function getMyPassengerProfile() {
  try {
    const { data, error } = await supabase.rpc('get_my_passenger_profile');

    if (error) {
      console.error("Error fetching my passenger profile:", error);
      return null;
    }

    return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Unexpected error fetching my passenger profile:", error);
    return null;
  }
}

export async function upsertMyPassengerProfile(input: {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}) {
  try {
    const { data, error } = await supabase.rpc('upsert_my_passenger_profile', {
      _first_name: input.first_name,
      _last_name: input.last_name,
      _phone: input.phone,
      _email: input.email
    });

    if (error) {
      console.error("Error upserting passenger profile:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error upserting passenger profile:", error);
    throw error;
  }
}

export function buildAvatarUrl(userId: string, filename?: string) {
  if (!filename) return null;
  
  const path = `${userId}/${filename}`;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}
