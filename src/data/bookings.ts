import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

// Remove the conflicting import and local declaration
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
    // 1. Update the booking with the driver assignment and status
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .update({
        driver_id: driverId,
        status: 'offer_sent',
        final_price: finalPrice,
        payment_confirmation_status: 'offer_sent'
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) {
      console.error("Error assigning driver to booking:", bookingError);
      throw new Error(bookingError.message);
    }

    // 2. Create a timeline event
    const { data: timelineData, error: timelineError } = await supabase
      .from('timeline_events')
      .insert([
        {
          booking_id: bookingId,
          event_type: 'driver_assigned',
          event_description: `Driver assigned and offer sent.`,
          event_data: { driver_id: driverId, final_price: finalPrice },
        },
      ])
      .select()
      .single();

    if (timelineError) {
      console.error("Error creating timeline event:", timelineError);
      throw new Error(timelineError.message);
    }

    // 3. Create a status history event
     const { data: statusHistoryData, error: statusHistoryError } = await supabase
      .from('booking_status_history')
      .insert([
        {
          booking_id: bookingId,
          status: 'offer_sent',
          status_description: `Driver assigned and offer sent.`,
          status_data: { driver_id: driverId, final_price: finalPrice },
        },
      ])
      .select()
      .single();

    if (statusHistoryError) {
      console.error("Error creating status history event:", statusHistoryError);
      throw new Error(statusHistoryError.message);
    }

    return bookingData;
  } catch (error) {
    console.error("Error in sendOffer:", error);
    throw error;
  }
};
