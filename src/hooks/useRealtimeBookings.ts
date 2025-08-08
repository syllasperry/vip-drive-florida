import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeBookingsOptions {
  userId: string;
  userType: 'passenger' | 'driver';
  onBookingUpdate?: (booking: any) => void;
}

export const useRealtimeBookings = ({ userId, userType, onBookingUpdate }: UseRealtimeBookingsOptions) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
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

          if (isRelevantToUser && onBookingUpdate) {
            console.log('📡 Realtime booking update:', {
              event: payload.eventType,
              bookingId: booking?.id,
              statusPassenger: booking?.status_passenger,
              statusDriver: booking?.status_driver,
              userType
            });
            onBookingUpdate(booking);
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

  return { isConnected };
};