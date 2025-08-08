
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeBookingsOptions {
  userId: string;
  userType: 'passenger' | 'driver';
  onBookingUpdate?: (booking: any) => void;
}

interface UseRealtimeBookingsReturn {
  bookings: any[];
  loading: boolean;
  error: string | null;
  isConnected: boolean;
}

export const useRealtimeBookings = ({ userId, userType, onBookingUpdate }: UseRealtimeBookingsOptions): UseRealtimeBookingsReturn => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Fetch initial bookings
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq(userType === 'passenger' ? 'passenger_id' : 'driver_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        setBookings(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    // Create realtime subscription for bookings
    const channel = supabase
      .channel('bookings_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          const booking = payload.new as any;
          
          // Only process updates relevant to current user
          const isRelevantToUser = userType === 'passenger' 
            ? booking?.passenger_id === userId
            : booking?.driver_id === userId;

          if (isRelevantToUser) {
            console.log('📡 Realtime booking update:', {
              event: payload.eventType,
              bookingId: booking?.id,
              statusPassenger: booking?.status_passenger,
              statusDriver: booking?.status_driver,
              userType
            });
            
            if (onBookingUpdate) {
              onBookingUpdate(booking);
            }

            // Update bookings list
            setBookings(prev => {
              const existingIndex = prev.findIndex(b => b.id === booking.id);
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = booking;
                return updated;
              } else {
                return [booking, ...prev];
              }
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [userId, userType, onBookingUpdate]);

  return { bookings, loading, error, isConnected };
};
