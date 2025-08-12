
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatusHistoryItem {
  id: string;
  booking_id: string;
  status: string;
  updated_by: string | null;
  role: string | null;
  created_at: string;
  metadata?: any;
}

export const useBookingStatusHistory = (bookingId: string) => {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('booking_status_history')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Convert the data to match our interface
        const formattedHistory: StatusHistoryItem[] = (data || []).map(item => ({
          id: item.id.toString(),
          booking_id: item.booking_id,
          status: item.status,
          updated_by: item.updated_by,
          role: item.role,
          created_at: item.created_at,
          metadata: item.metadata
        }));

        setHistory(formattedHistory);
      } catch (err) {
        console.error('Error fetching booking status history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Set up real-time subscription
    const channel = supabase
      .channel('booking_status_history_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'booking_status_history',
        filter: `booking_id=eq.${bookingId}`
      }, () => {
        fetchHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { history, loading, error };
};
