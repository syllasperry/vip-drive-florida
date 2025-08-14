
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    // Get the current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    // Query bookings table with related data, using the correct column name
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
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false }); // Use created_at instead of pickup_time for ordering
    
    if (error) {
      console.error('Error fetching passenger bookings:', error);
      throw error;
    }

    console.log('Passenger bookings fetched:', Array.isArray(data) ? data.length : 0, 'bookings');
    console.log('Raw booking data:', data);
    
    // Ensure we always return an array
    if (!data) return [];
    if (!Array.isArray(data)) return [];
    
    // Sort by pickup_time when available, otherwise by created_at
    const sortedData = data.sort((a, b) => {
      // If both have pickup_time, sort by that (ascending)
      if (a.pickup_time && b.pickup_time) {
        return new Date(a.pickup_time).getTime() - new Date(b.pickup_time).getTime();
      }
      // If only one has pickup_time, prioritize it
      if (a.pickup_time && !b.pickup_time) return -1;
      if (!a.pickup_time && b.pickup_time) return 1;
      
      // Both don't have pickup_time, sort by created_at (descending)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    return sortedData;
  } catch (error) {
    console.error('Unexpected error in getMyPassengerBookings:', error);
    throw error;
  }
}
