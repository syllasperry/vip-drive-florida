
import { supabase } from '@/integrations/supabase/client';

export const getBookingStatusHistory = async (bookingId: string) => {
  console.log('🔍 Fetching booking status history for:', bookingId);
  
  try {
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching booking status history:', error);
      throw error;
    }

    console.log('✅ Booking status history loaded:', data?.length || 0, 'entries');
    return data || [];
  } catch (error) {
    console.error('❌ Failed to fetch booking status history:', error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId: string, updates: any) => {
  console.log('🔄 Updating booking status for:', bookingId, updates);
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating booking status:', error);
      throw error;
    }

    console.log('✅ Booking status updated successfully');
    return data;
  } catch (error) {
    console.error('❌ Failed to update booking status:', error);
    throw error;
  }
};

export const mapToSimpleStatus = (booking: any) => {
  if (booking.ride_status === 'completed') return 'completed';
  if (booking.status === 'cancelled') return 'cancelled';
  if (booking.payment_confirmation_status === 'all_set') return 'all_set';
  if (booking.payment_confirmation_status === 'passenger_paid') return 'payment_pending';
  return 'booking_requested';
};
