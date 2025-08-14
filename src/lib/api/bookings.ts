
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    console.log('🔄 Starting passenger bookings fetch via RPC...');
    
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

    // Use the new RPC function
    const { data, error } = await supabase.rpc("get_passenger_bookings_by_auth");
    
    if (error) {
      console.error('❌ RPC query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log('✅ RPC booking data received:', data);
    console.log('📊 Number of bookings found:', data?.length || 0);
    
    // Ensure we always return an array
    const bookings = data || [];
    
    // Log each booking for debugging
    bookings.forEach((booking, index) => {
      console.log(`📋 Booking ${index + 1}:`, {
        id: booking.booking_id,
        status: booking.status,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        created_at: booking.created_at,
        passenger_id: booking.passenger_id
      });
    });
    
    // Transform RPC result to match expected format
    const transformedBookings = bookings.map((booking: any) => ({
      id: booking.booking_id,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      pickup_time: booking.pickup_time,
      passenger_count: booking.passenger_count,
      status: booking.status,
      ride_status: booking.ride_status,
      payment_confirmation_status: booking.payment_confirmation_status,
      status_passenger: booking.status_passenger,
      status_driver: booking.status_driver,
      estimated_price: booking.estimated_price,
      final_price: booking.final_price,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      passenger_id: booking.passenger_id,
      driver_id: booking.driver_id,
      drivers: booking.driver_name ? {
        id: booking.driver_id,
        full_name: booking.driver_name,
        profile_photo_url: booking.driver_photo_url,
        car_make: booking.driver_car_make,
        car_model: booking.driver_car_model,
        phone: booking.driver_phone,
        email: booking.driver_email,
        license_plate: booking.driver_license_plate
      } : null,
      passengers: {
        id: booking.passenger_id,
        full_name: booking.passenger_name,
        profile_photo_url: booking.passenger_photo_url,
        phone: booking.passenger_phone,
        email: booking.passenger_email
      }
    }));
    
    // Sort by pickup_time when available, otherwise by created_at
    const sortedBookings = transformedBookings.sort((a, b) => {
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

export async function fetchPassengerBookings() {
  const { data, error } = await supabase.rpc("get_passenger_bookings_by_auth");
  if (error) throw error;
  return data ?? [];
}

/**
 * Subscribes to any changes on public.bookings and public.passengers.
 * Call `onInvalidate()` to re-fetch. Returns an unsubscribe function.
 */
export function subscribeToBookingsAndPassengers(onInvalidate?: () => void) {
  const channel = supabase
    .channel("bookings-and-passengers")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => {
        console.log('🔄 Real-time: bookings table changed, invalidating...');
        onInvalidate?.();
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "passengers" },
      () => {
        console.log('🔄 Real-time: passengers table changed, invalidating...');
        onInvalidate?.();
      }
    )
    .subscribe();

  return () => {
    try { 
      channel.unsubscribe(); 
      console.log('🔄 Real-time: unsubscribed from bookings and passengers');
    } catch { 
      /* no-op */ 
    }
  };
}
