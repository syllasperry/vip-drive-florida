
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    console.log('🔄 Starting passenger bookings fetch...');
    
    // Get the current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User authentication error:', userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }

    if (!user) {
      console.error('❌ No authenticated user found');
      throw new Error('No authenticated user found');
    }

    console.log('✅ Authenticated user ID:', user.id);

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
      console.error('❌ Supabase query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log('✅ Raw booking data received:', data);
    console.log('📊 Number of bookings found:', data?.length || 0);
    
    // Ensure we always return an array
    const bookings = data || [];
    
    // Log each booking for debugging
    bookings.forEach((booking, index) => {
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
    
    // Sort by pickup_time when available, otherwise by created_at
    const sortedBookings = bookings.sort((a, b) => {
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
    
    console.log('🔄 Sorted bookings:', sortedBookings.length, 'total');
    return sortedBookings;
    
  } catch (error) {
    console.error('💥 Error in getMyPassengerBookings:', error);
    
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error occurred while fetching bookings');
    }
  }
}
