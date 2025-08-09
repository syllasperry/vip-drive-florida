
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';

export const useRealtimeBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            passengers:passenger_id(*),
            drivers:driver_id(*)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (mounted) {
          setBookings(data || []);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    // Set up real-time subscription
    const channel = supabase
      .channel('bookings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Real-time booking update:', payload);
          fetchBookings(); // Refresh the entire list for simplicity
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { bookings, loading, error, refetch: () => window.location.reload() };
};
