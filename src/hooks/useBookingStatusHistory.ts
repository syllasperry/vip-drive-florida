
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBookingStatusHistory = (bookingId: string) => {
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('booking_status_history')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setStatusHistory(data || []);
      } catch (error) {
        console.error('Error fetching status history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchStatusHistory();
    }
  }, [bookingId]);

  return { statusHistory, loading };
};
