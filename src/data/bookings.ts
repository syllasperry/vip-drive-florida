
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

    // First, get the current booking to validate its state
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

    // Validate that booking is in a state that allows driver assignment
    const allowedStates = ['booking_requested', 'waiting_for_offer', 'pending', null, undefined];
    const currentStatus = currentBooking.payment_confirmation_status || currentBooking.status;
    
    if (!allowedStates.includes(currentStatus)) {
      throw new Error(`Booking must be in 'needs driver' state to assign a driver. Current state: ${currentStatus}`);
    }

    // Step 1: ONLY assign driver_id (no other fields to avoid constraint violation)
    const { data: driverAssignmentData, error: driverAssignmentError } = await supabase
      .from('bookings')
      .update({
        driver_id: driverId
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (driverAssignmentError) {
      console.error("Error assigning driver:", driverAssignmentError);
      throw new Error(`Failed to assign driver: ${driverAssignmentError.message}`);
    }

    console.log('[SEND_OFFER] Driver assigned successfully', {
      id: driverAssignmentData.id,
      driver_id: driverAssignmentData.driver_id
    });

    // Small delay to ensure the first update is committed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 2: Now update offer details and status (driver_id is already set)
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
      .eq('driver_id', driverId) // Additional safety check
      .select()
      .single();

    if (offerError) {
      console.error("Error updating offer details:", offerError);
      
      // If the second step fails, try to revert the driver assignment
      try {
        await supabase
          .from('bookings')
          .update({ driver_id: null })
          .eq('id', bookingId);
        console.log('[SEND_OFFER] Reverted driver assignment due to offer update failure');
      } catch (revertError) {
        console.error("Failed to revert driver assignment:", revertError);
      }
      
      throw new Error(`Failed to update offer details: ${offerError.message}`);
    }

    console.log('[SEND_OFFER] Offer details updated successfully', {
      id: offerData.id,
      final_price: offerData.final_price,
      status: offerData.status
    });

    // Step 3: Create timeline event (non-critical, don't fail the whole process)
    try {
      const { data: timelineData, error: timelineError } = await supabase
        .from('timeline_events')
        .insert([
          {
            booking_id: bookingId,
            status: 'offer_sent',
            system_message: `Driver assigned and offer sent for $${finalPrice}`,
            driver_id: driverId,
            passenger_id: offerData.passenger_id,
          },
        ])
        .select()
        .single();

      if (timelineError) {
        console.warn("Timeline event creation failed:", timelineError);
      } else {
        console.log('[SEND_OFFER] Timeline event created', timelineData.id);
      }
    } catch (timelineError) {
      console.warn("Timeline event creation failed:", timelineError);
    }

    // Step 4: Create status history event (non-critical, don't fail the whole process)
    try {
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
        console.warn("Status history creation failed:", statusHistoryError);
      } else {
        console.log('[SEND_OFFER] Status history created', statusHistoryData.id);
      }
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
