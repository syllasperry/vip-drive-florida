
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';

export const updateBookingStatus = async (bookingId: string, updates: Record<string, any>) => {
  try {
    console.log('🔄 Updating booking status:', bookingId, updates);
    
    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating booking:', error);
      throw error;
    }

    console.log('✅ Booking status updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in updateBookingStatus:', error);
    throw error;
  }
};

export const createBookingStatusHistory = async (
  bookingId: string,
  status: string,
  role: 'driver' | 'passenger' | 'dispatcher',
  notes?: string
) => {
  try {
    console.log('📝 Creating booking status history entry:', { bookingId, status, role });
    
    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status,
        updated_by: user.user?.id,
        role,
        notes,
        metadata: {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating status history:', error);
      throw error;
    }

    console.log('✅ Status history created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in createBookingStatusHistory:', error);
    throw error;
  }
};

export const getBookingStatusHistory = async (bookingId: string) => {
  try {
    console.log('📈 Getting booking status history for:', bookingId);
    
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error getting status history:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getBookingStatusHistory:', error);
    throw error;
  }
};

export const userOwnsBooking = async (bookingId: string): Promise<boolean> => {
  try {
    console.log('🔒 Checking booking ownership:', bookingId);
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    const { data, error } = await supabase
      .from('bookings')
      .select('passenger_id, driver_id')
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('❌ Error checking booking ownership:', error);
      return false;
    }

    const owns = data.passenger_id === user.user.id || data.driver_id === user.user.id;
    console.log('✅ User owns booking:', owns);
    return owns;
  } catch (error) {
    console.error('❌ Error in userOwnsBooking:', error);
    return false;
  }
};

// Helper function to map booking status to simple status
export const mapToSimpleStatus = (booking: any): Booking['simple_status'] => {
  console.log('🔍 Mapping booking status:', { 
    status: booking.status,
    ride_status: booking.ride_status, 
    payment_confirmation_status: booking.payment_confirmation_status,
    final_price: booking.final_price,
    driver_id: booking.driver_id
  });
  
  if (booking.status === 'completed' || booking.ride_status === 'completed') return 'completed';
  if (booking.status === 'cancelled') return 'cancelled';
  
  if (booking.payment_confirmation_status === 'all_set' || booking.ride_status === 'all_set') return 'all_set';
  
  // When dispatcher sends offer, show as payment_pending for passenger
  const hasOfferSent = booking.status === 'offer_sent' || 
                      booking.ride_status === 'offer_sent' || 
                      booking.payment_confirmation_status === 'price_awaiting_acceptance' ||
                      (booking.final_price && booking.final_price > 0 && booking.driver_id);
  
  if (hasOfferSent) {
    console.log('✅ Detected offer sent - showing payment_pending');
    return 'payment_pending';
  }
  
  // If booking is pending and no driver assigned or no offer sent, show as booking_requested
  return 'booking_requested';
};
