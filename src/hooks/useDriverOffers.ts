
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverOffer {
  id: string;
  booking_id: string;
  driver_id: string;
  vehicle_id: string;
  price_cents: number;
  offer_price: number;
  status: string;
  estimated_arrival_time: string;
  created_at: string;
  updated_at: string;
}

interface UseDriverOffersOptions {
  bookingId: string | null;
  enabled?: boolean;
}

export const useDriverOffers = ({ bookingId, enabled = true }: UseDriverOffersOptions) => {
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOffers = async () => {
    if (!bookingId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Check booking for offer status
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      // Create simulated offers based on booking data
      const simulatedOffers: DriverOffer[] = [];
      if (booking && booking.final_price && booking.driver_id && booking.ride_status === 'offer_sent') {
        simulatedOffers.push({
          id: `offer-${booking.id}`,
          booking_id: booking.id,
          driver_id: booking.driver_id,
          vehicle_id: booking.vehicle_id || '',
          price_cents: Math.round((booking.final_price || 0) * 100),
          offer_price: booking.final_price || 0,
          status: 'offer_sent',
          estimated_arrival_time: '5 minutes',
          created_at: booking.updated_at || booking.created_at,
          updated_at: booking.updated_at || booking.created_at
        });
      }
      
      setOffers(simulatedOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [bookingId, enabled]);

  // Real-time subscription for booking changes
  useEffect(() => {
    if (!bookingId || !enabled) return;

    const channel = supabase
      .channel(`offers-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Booking update for offers:', payload);
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, enabled]);

  return {
    offers,
    loading,
    error,
    refresh: fetchOffers
  };
};
