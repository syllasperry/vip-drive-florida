
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
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching bookings:", error);
    return null;
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
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching passenger bookings:", error);
    return null;
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
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching driver bookings:", error);
    return null;
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
      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error fetching dispatcher bookings:", error);
    return null;
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

    // First, get the current booking to check its state
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error("Error fetching current booking:", fetchError);
      throw new Error(fetchError.message);
    }

    console.log('[SEND_OFFER] Current booking state', currentBooking);

    // Step 1: Update only the driver assignment and basic status first
    const { data: driverAssignmentData, error: driverAssignmentError } = await supabase
      .from('bookings')
      .update({
        driver_id: driverId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (driverAssignmentError) {
      console.error("Error assigning driver:", driverAssignmentError);
      throw new Error(driverAssignmentError.message);
    }

    console.log('[SEND_OFFER] Driver assigned successfully', driverAssignmentData);

    // Step 2: Now update the offer details and status
    const { data: offerData, error: offerError } = await supabase
      .from('bookings')
      .update({
        final_price: finalPrice,
        status: 'offer_sent',
        payment_confirmation_status: 'offer_sent',
        ride_status: 'offer_sent',
        status_driver: 'offer_sent',
        status_passenger: 'review_offer',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (offerError) {
      console.error("Error updating offer details:", offerError);
      throw new Error(offerError.message);
    }

    console.log('[SEND_OFFER] Offer details updated successfully', offerData);

    // Step 3: Create timeline event
    const { data: timelineData, error: timelineError } = await supabase
      .from('timeline_events')
      .insert([
        {
          booking_id: bookingId,
          status: 'offer_sent',
          system_message: `Driver assigned and offer sent.`,
          driver_id: driverId,
          passenger_id: offerData.passenger_id,
        },
      ])
      .select()
      .single();

    if (timelineError) {
      console.error("Error creating timeline event:", timelineError);
      // Don't throw here, as the main operation succeeded
      console.warn("Timeline event creation failed, but offer was sent successfully");
    } else {
      console.log('[SEND_OFFER] Timeline event created', timelineData);
    }

    // Step 4: Create status history event
    const { data: statusHistoryData, error: statusHistoryError } = await supabase
      .from('booking_status_history')
      .insert([
        {
          booking_id: bookingId,
          status: 'offer_sent',
          metadata: { driver_id: driverId, final_price: finalPrice },
        },
      ])
      .select()
      .single();

    if (statusHistoryError) {
      console.error("Error creating status history event:", statusHistoryError);
      // Don't throw here, as the main operation succeeded
      console.warn("Status history creation failed, but offer was sent successfully");
    } else {
      console.log('[SEND_OFFER] Status history created', statusHistoryData);
    }

    console.log('[SEND_OFFER] Process completed successfully');
    return offerData;
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
