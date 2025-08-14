
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    // Get the current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not authenticated:', userError);
      throw new Error('User not authenticated');
    }

    console.log('🔍 Fetching bookings for user:', user.id);

    // Query bookings table with related data
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching passenger bookings:', error);
      throw error;
    }

    console.log('✅ Raw booking data from Supabase:', data);
    console.log('📊 Bookings count:', Array.isArray(data) ? data.length : 0);
    
    // Log each booking for debugging
    if (Array.isArray(data) && data.length > 0) {
      data.forEach((booking, index) => {
        console.log(`📋 Booking ${index + 1}:`, {
          id: booking.id,
          status: booking.status,
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          pickup_time: booking.pickup_time,
          created_at: booking.created_at,
          passenger_id: booking.passenger_id
        });
      });
    }
    
    // Ensure we always return an array
    if (!data) {
      console.log('⚠️ No data returned from Supabase');
      return [];
    }
    if (!Array.isArray(data)) {
      console.log('⚠️ Data is not an array:', typeof data);
      return [];
    }
    
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
    
    console.log('🔄 Sorted data:', sortedData.length, 'bookings');
    return sortedData;
  } catch (error) {
    console.error('💥 Unexpected error in getMyPassengerBookings:', error);
    throw error;
  }
}
