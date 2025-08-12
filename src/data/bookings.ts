
import { supabase } from '@/integrations/supabase/client';
import { normalizeBookingStatus } from '@/utils/statusHelpers';

export const sendOfferAtomic = async (bookingId: string, driverId: string, price: number) => {
  console.log('🚀 sendOfferAtomic:', { bookingId, driverId, price });

  try {
    // Normalize status before insertion
    const normalizedStatus = normalizeBookingStatus('offer_sent');
    
    // Insert into driver_offers table
    const { data: offerData, error: offerError } = await supabase
      .from('driver_offers')
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        offer_price: price,
        status: normalizedStatus
      })
      .select()
      .single();

    if (offerError) {
      console.error('❌ Error inserting offer:', offerError);
      throw offerError;
    }

    console.log('✅ Offer inserted successfully:', offerData);

    // Update booking with normalized status
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: normalizedStatus,
        final_price: price,
        driver_id: driverId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error updating booking:', bookingError);
      throw bookingError;
    }

    console.log('✅ Booking updated successfully:', bookingData);

    // Insert status history with normalized status
    const { error: historyError } = await supabase
      .from('ride_status_history')
      .insert({
        booking_id: bookingId,
        new_status: normalizedStatus,
        previous_status: 'pending',
        changed_by: driverId
      });

    if (historyError) {
      console.error('❌ Error inserting status history:', historyError);
      throw historyError;
    }

    console.log('✅ Status history inserted successfully');

    return { offer: offerData, booking: bookingData };
  } catch (error) {
    console.error('❌ sendOfferAtomic failed:', error);
    throw error;
  }
};

export const sendOffer = sendOfferAtomic;

export const getDispatcherBookings = async () => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching dispatcher bookings:', error);
    throw error;
  }
};
