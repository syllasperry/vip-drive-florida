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

// Type for the passenger bookings response
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
    // Use direct query instead of RPC since it's not in the types
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        pickup_location,
        dropoff_location,
        pickup_time,
        created_at,
        passenger_id,
        driver_id,
        estimated_price,
        final_price,
        payment_confirmation_status,
        ride_status,
        passengers:passenger_id(
          full_name,
          phone,
          email,
          profile_photo_url
        ),
        drivers:driver_id(
          full_name,
          phone,
          profile_photo_url,
          car_make,
          car_model,
          car_color,
          license_plate
        )
      `)
      .eq('passenger_id', (await supabase.auth.getUser()).data.user?.id)
      .order('pickup_time', { ascending: false });
    
    if (error) {
      console.error("Error fetching passenger bookings:", error);
      throw error;
    }

    // Transform the data to match the expected format
    return (data || []).map((booking: any) => ({
      booking_id: booking.id || '',
      status: booking.status || 'pending',
      pickup_location: booking.pickup_location || '',
      dropoff_location: booking.dropoff_location || '',
      pickup_time: booking.pickup_time || '',
      created_at: booking.created_at || '',
      passenger_id: booking.passenger_id || '',
      passenger_name: booking.passengers?.full_name || '',
      passenger_phone: booking.passengers?.phone || '',
      passenger_email: booking.passengers?.email || '',
      passenger_photo_url: booking.passengers?.profile_photo_url,
      driver_id: booking.driver_id,
      driver_name: booking.drivers?.full_name,
      driver_phone: booking.drivers?.phone,
      driver_photo_url: booking.drivers?.profile_photo_url,
      driver_car_make: booking.drivers?.car_make,
      driver_car_model: booking.drivers?.car_model,
      driver_car_color: booking.drivers?.car_color,
      driver_license_plate: booking.drivers?.license_plate,
      estimated_price: booking.estimated_price,
      final_price: booking.final_price,
      payment_confirmation_status: booking.payment_confirmation_status || 'waiting_for_offer',
      ride_status: booking.ride_status || 'pending'
    }));
  } catch (error) {
    console.error("Unexpected error fetching passenger bookings:", error);
    return [];
  }
};

export const subscribeToBookingsAndPassengers = (onInvalidate?: () => void) => {
  const channel = supabase
    .channel("bookings-and-passengers")
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => onInvalidate?.())
    .on("postgres_changes", { event: "*", schema: "public", table: "passengers" }, () => onInvalidate?.())
    .subscribe();
  
  return () => supabase.removeChannel(channel);
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

export const getDispatcherBookings = async () => {
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
        ),
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
      .order('pickup_time', { ascending: false });

    if (error) {
      console.error("Error fetching dispatcher bookings:", error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Unexpected error fetching dispatcher bookings:", error);
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
