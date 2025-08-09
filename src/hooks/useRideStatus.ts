
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRideStatus = (bookingId: string) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (error) throw error;
        setStatus(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching ride status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ride status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`ride_status_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Real-time ride status update:', payload);
          setStatus(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { status, loading, error };
};
