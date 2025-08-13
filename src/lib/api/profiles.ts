
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
