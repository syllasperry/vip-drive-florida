
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    // Direct query to bookings table with related data
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        drivers (
          id,
          full_name,
          profile_photo_url,
          car_make,
          car_model,
          phone,
          email
        ),
        passengers (
          id,
          full_name,
          profile_photo_url,
          preferred_temperature,
          music_preference,
          interaction_preference,
          trip_purpose,
          additional_notes
        )
      `)
      .eq('passenger_id', (await supabase.auth.getUser()).data.user?.id)
      .order('pickup_time', { ascending: true, nullsFirst: false });
    
    if (error) {
      console.error('Error fetching passenger bookings:', error);
      throw error;
    }

    console.log('Passenger bookings fetched:', Array.isArray(data) ? data.length : 0, 'bookings');
    
    // Ensure we always return an array
    if (!data) return [];
    if (!Array.isArray(data)) return [];
    
    return data;
  } catch (error) {
    console.error('Unexpected error in getMyPassengerBookings:', error);
    throw error;
  }
}
