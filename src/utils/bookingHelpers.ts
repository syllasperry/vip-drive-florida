
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
