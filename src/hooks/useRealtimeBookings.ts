
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
        console.log('🔄 Fetching bookings with real-time updates...');
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            passengers:passenger_id(*),
            drivers:driver_id(*)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching bookings:', error);
          throw error;
        }

        if (mounted) {
          console.log('✅ Bookings fetched successfully:', data?.length || 0, 'bookings');
          // Ensure we always set an array, even if data is null
          const safeData = Array.isArray(data) ? data : [];
          setBookings(safeData);
          setError(null);
        }
      } catch (err) {
        console.error('❌ Error in fetchBookings:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
          // Set empty array on error to prevent .map() issues
          setBookings([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    // Set up real-time subscription for all bookings changes
    const channel = supabase
      .channel('bookings_realtime_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Real-time booking update received:', payload);
          
          // Immediately refresh the bookings list when any change occurs
          fetchBookings();
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      mounted = false;
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  // Manual refresh function
  const refetch = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers:passenger_id(*),
          drivers:driver_id(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure we always set an array
      const safeData = Array.isArray(data) ? data : [];
      setBookings(safeData);
      setError(null);
      console.log('✅ Manual refresh completed');
    } catch (err) {
      console.error('❌ Error in manual refresh:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh bookings');
      // Set empty array on error
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  return { bookings, loading, error, refetch };
};
