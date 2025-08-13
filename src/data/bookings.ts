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

    // First, validate the current booking state
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error("Error fetching current booking:", fetchError);
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    console.log('[SEND_OFFER] Current booking state', {
      id: currentBooking.id,
      status: currentBooking.status,
      driver_id: currentBooking.driver_id,
      payment_confirmation_status: currentBooking.payment_confirmation_status
    });

    // Check if booking is already assigned to a different driver
    if (currentBooking.driver_id && currentBooking.driver_id !== driverId) {
      throw new Error('Booking is already assigned to another driver');
    }

    // If driver is already assigned, just update the offer details
    if (currentBooking.driver_id === driverId) {
      console.log('[SEND_OFFER] Driver already assigned, updating offer details only');
      
      const { data: updatedBooking, error: updateError } = await supabase
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
        .eq('driver_id', driverId)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating offer details:", updateError);
        throw new Error(`Failed to update offer: ${updateError.message}`);
      }

      console.log('[SEND_OFFER] Offer updated successfully');
      return updatedBooking;
    }

    // Driver not assigned yet - do a single update that assigns driver and sets offer
    console.log('[SEND_OFFER] Assigning driver and setting offer in single operation');
    
    const { data: offerData, error: offerError } = await supabase
      .from('bookings')
      .update({
        driver_id: driverId,
        final_price: finalPrice,
        status: 'offer_sent',
        payment_confirmation_status: 'offer_sent',
        ride_status: 'offer_sent',
        status_driver: 'offer_sent',
        status_passenger: 'review_offer',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .is('driver_id', null) // Only update if driver_id is currently null
      .select()
      .single();

    if (offerError) {
      console.error("Error in single offer operation:", offerError);
      throw new Error(`Failed to send offer: ${offerError.message}`);
    }

    console.log('[SEND_OFFER] Offer sent successfully', {
      id: offerData.id,
      final_price: offerData.final_price,
      driver_id: offerData.driver_id,
      status: offerData.status
    });

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
            passenger_id: offerData.passenger_id,
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
