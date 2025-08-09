
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
