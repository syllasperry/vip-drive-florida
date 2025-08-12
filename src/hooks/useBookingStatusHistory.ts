
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatusHistoryItem {
  id: string;
  status: string;
  timestamp: string;
  changed_by: string;
  role: string;
}

export const useBookingStatusHistory = (bookingId: string) => {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!bookingId) return;
      
      try {
        const { data, error } = await supabase
          .from('booking_status_history')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const mappedHistory = (data || []).map(item => ({
          id: item.id.toString(),
          status: item.status,
          timestamp: item.timestamp,
          changed_by: item.changed_by,
          role: item.role
        }));
        
        setHistory(mappedHistory);
      } catch (error) {
        console.error('Error fetching booking status history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [bookingId]);

  return { history, loading };
};
