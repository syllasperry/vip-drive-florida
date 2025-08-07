
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DriverOffer {
  id: string;
  booking_id: string;
  driver_id: string;
  offer_price: number;
  status: 'offer_sent' | 'accepted' | 'declined';
  created_at: string;
}

interface UseDriverOffersOptions {
  bookingId: string | null;
  enabled?: boolean;
}

export const useDriverOffers = ({ bookingId, enabled = true }: UseDriverOffersOptions) => {
  const [offers, setOffers] = useState<DriverOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch offers - work with existing bookings by checking booking data
  const fetchOffers = async () => {
    if (!bookingId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Instead of querying non-existent driver_offers table, 
      // check if booking has offer-related data
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      console.log('📊 Checking booking for offers:', {
        bookingId,
        final_price: booking?.final_price,
        estimated_price: booking?.estimated_price,
        ride_status: booking?.ride_status,
        status_driver: booking?.status_driver,
        payment_confirmation_status: booking?.payment_confirmation_status
      });

      // Create synthetic offer if booking shows driver has sent offer
      const syntheticOffers: DriverOffer[] = [];
      
      if (booking && (
        booking.ride_status === 'offer_sent' ||
        booking.status_driver === 'offer_sent' ||
        booking.payment_confirmation_status === 'price_awaiting_acceptance' ||
        (booking.final_price && booking.final_price !== booking.estimated_price)
      )) {
        syntheticOffers.push({
          id: `synthetic_${booking.id}`,
          booking_id: booking.id,
          driver_id: booking.driver_id,
          offer_price: booking.final_price || booking.estimated_price,
          status: booking.status_passenger === 'offer_accepted' ? 'accepted' : 'offer_sent',
          created_at: booking.updated_at || booking.created_at
        });
      }

      console.log('🎯 Generated synthetic offers:', syntheticOffers);
      setOffers(syntheticOffers);
    } catch (err) {
      console.error('❌ Error fetching offers:', err);
      setError('Failed to fetch offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOffers();
  }, [bookingId, enabled]);

  // Real-time subscription for booking updates that might indicate new offers
  useEffect(() => {
    if (!bookingId || !enabled) return;

    console.log('📡 Setting up real-time subscription for booking:', bookingId);

    const channel = supabase
      .channel(`booking-offers-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Real-time booking update for offers:', payload);
          fetchOffers(); // Refresh offers when booking changes
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up real-time subscription for:', bookingId);
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
