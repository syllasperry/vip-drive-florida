import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

export const normalizeBookingStatus = (booking: any) => {
  if (booking.payment_confirmation_status === 'all_set' && booking.ride_status === 'completed') {
    return 'completed';
  }
  if (booking.payment_confirmation_status === 'cancelled') {
    return 'cancelled';
  }
  if (booking.payment_confirmation_status === 'waiting_for_offer') {
    return 'booking_requested';
  }
  if (booking.payment_confirmation_status === 'offer_sent') {
    return 'payment_pending';
  }
  if (booking.payment_confirmation_status === 'all_set') {
    return 'all_set';
  }
  return 'booking_requested';
};

// Type for the passenger bookings response from RPC
interface PassengerBookingResponse {
  booking_id: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  created_at: string;
  passenger_id: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  passenger_photo_url: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_photo_url: string | null;
  driver_car_make: string | null;
  driver_car_model: string | null;
  driver_car_color: string | null;
  driver_license_plate: string | null;
  estimated_price: number | null;
  final_price: number | null;
  payment_confirmation_status: string;
  ride_status: string;
}

export const fetchPassengerBookings = async (): Promise<PassengerBookingResponse[]> => {
  try {
    console.log('🔄 Fetching passenger bookings using RPC function...');
    
    // Use the RPC function to get bookings - manual call since it's not in types yet
    const { data, error } = await supabase.rpc('get_passenger_bookings_by_auth' as any);
    
    if (error) {
      console.error("❌ Error fetching passenger bookings:", error);
      throw error;
    }

    console.log('✅ Passenger bookings fetched successfully:', Array.isArray(data) ? data.length : 0, 'bookings');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("❌ Unexpected error fetching passenger bookings:", error);
    return [];
  }
};

export const subscribeToBookingsAndPassengers = (onInvalidate?: () => void) => {
  console.log('📡 Setting up real-time subscription for bookings and passengers...');
  
  const channel = supabase
    .channel("dashboard-updates")
    .on("postgres_changes", { 
      event: "*", 
      schema: "public", 
      table: "bookings" 
    }, (payload) => {
      console.log('📡 Real-time bookings update received:', payload);
      onInvalidate?.();
    })
    .on("postgres_changes", { 
      event: "*", 
      schema: "public", 
      table: "passengers" 
    }, (payload) => {
      console.log('📡 Real-time passengers update received:', payload);
      onInvalidate?.();
    })
    .subscribe((status) => {
      console.log('📡 Real-time subscription status:', status);
    });
  
  return () => {
    console.log('🧹 Cleaning up real-time subscription');
    supabase.removeChannel(channel);
  };
};

export const getBookings = async () => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers (
          id,
          full_name,
          phone,
          profile_photo_url,
          preferred_temperature,
          music_preference,
          interaction_preference,
          trip_purpose,
          additional_notes
        )
      `)
      .order('pickup_time', { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Unexpected error fetching bookings:", error);
    return [];
  }
};

export const getAllBookings = getBookings;

export const getBookingById = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers (
          id,
          full_name,
          phone,
          profile_photo_url,
          preferred_temperature,
          music_preference,
          interaction_preference,
          trip_purpose,
          additional_notes
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error("Error fetching booking:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching booking:", error);
    return null;
  }
};

export const getPassengerBookings = async (passengerId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        drivers (
          full_name,
          phone,
          profile_photo_url,
          car_make,
          car_model,
          car_color,
          license_plate
        )
      `)
      .eq('passenger_id', passengerId)
      .order('pickup_time', { ascending: false });

    if (error) {
      console.error("Error fetching passenger bookings:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Unexpected error fetching passenger bookings:", error);
    return [];
  }
};

export const getDriverBookings = async (driverId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers (
          id,
          full_name,
          phone,
          profile_photo_url,
          preferred_temperature,
          music_preference,
          interaction_preference,
          trip_purpose,
          additional_notes
        )
      `)
      .eq('driver_id', driverId)
      .order('pickup_time', { ascending: false });

    if (error) {
      console.error("Error fetching driver bookings:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Unexpected error fetching driver bookings:", error);
    return [];
  }
};

// Nova função para buscar bookings da view dispatcher_full_bookings
export const getDispatcherBookings = async () => {
  try {
    console.log('🔄 Fetching dispatcher bookings from view...');
    
    const { data, error } = await supabase
      .from('dispatcher_full_bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ Error fetching dispatcher bookings:", error);
      return [];
    }

    console.log('✅ Dispatcher bookings fetched successfully:', Array.isArray(data) ? data.length : 0, 'bookings');
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("❌ Unexpected error fetching dispatcher bookings:", error);
    return [];
  }
};

export const createBooking = async (bookingData: any) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error("Error creating booking:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error creating booking:", error);
    return null;
  }
};

export const updateBooking = async (bookingId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating booking:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error updating booking:", error);
    return null;
  }
};

export const deleteBooking = async (bookingId: string) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) {
      console.error("Error deleting booking:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error deleting booking:", error);
    return false;
  }
};

export const sendOffer = async (bookingId: string, driverId: string, finalPrice: number) => {
  try {
    console.log('[SEND_OFFER] Starting offer process', { bookingId, driverId, finalPrice });

    // Use the RPC function that exists in the types
    const { data, error } = await supabase.rpc('assign_driver_and_send_offer', {
      p_booking_id: bookingId,
      p_driver_id: driverId,
      p_final_price: finalPrice
    });

    if (error) {
      console.error("Error in RPC assign_driver_and_send_offer:", error);
      throw new Error(`Failed to send offer: ${error.message}`);
    }

    console.log('[SEND_OFFER] RPC operation successful:', data);

    // Create timeline event (non-critical)
    try {
      await supabase
        .from('timeline_events')
        .insert([
          {
            booking_id: bookingId,
            status: 'offer_sent',
            system_message: `Driver assigned and offer sent for $${finalPrice}`,
            driver_id: driverId,
            passenger_id: null, // We don't have passenger_id in the RPC response
          },
        ]);
    } catch (timelineError) {
      console.warn("Timeline event creation failed:", timelineError);
    }

    // Create status history event (non-critical)
    try {
      await supabase
        .from('booking_status_history')
        .insert([
          {
            booking_id: bookingId,
            status: 'offer_sent',
            metadata: { driver_id: driverId, final_price: finalPrice },
          },
        ]);
    } catch (statusHistoryError) {
      console.warn("Status history creation failed:", statusHistoryError);
    }

    return data;

  } catch (error) {
    console.error("Error in sendOffer:", error);
    throw error;
  }
};

// Add a placeholder function for listening to booking changes
export const listenForBookingChanges = (callback: (booking: any) => void) => {
  // This is a placeholder function
  // Real-time listening is handled by the useRealtimeBookings hook
  return () => {};
};
