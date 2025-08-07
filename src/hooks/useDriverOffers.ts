
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
      // Since driver_offers table doesn't exist in the current schema,
      // we'll simulate offers by looking at booking data
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      
      // Create a simulated offer if driver has sent one
      const simulatedOffers: DriverOffer[] = [];
      if (booking && booking.final_price && booking.driver_id) {
        simulatedOffers.push({
          id: `offer-${booking.id}`,
          booking_id: booking.id,
          driver_id: booking.driver_id,
          vehicle_id: booking.vehicle_id || '',
          price_cents: Math.round((booking.final_price || 0) * 100),
          offer_price: booking.final_price || 0,
          status: booking.ride_status === 'offer_sent' ? 'offer_sent' : 'pending',
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

  const createOffer = async (offerData: {
    booking_id: string;
    driver_id: string;
    vehicle_id: string;
    price_cents: number;
    offer_price: number;
    estimated_arrival_time?: string;
  }) => {
    try {
      // Update the booking with the offer price since we don't have driver_offers table
      const { data, error } = await supabase
        .from('bookings')
        .update({
          final_price: offerData.offer_price,
          ride_status: 'offer_sent',
          status_driver: 'offer_sent',
          payment_confirmation_status: 'price_awaiting_acceptance'
        })
        .eq('id', offerData.booking_id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Offer Sent!",
        description: "Your price offer has been sent to the passenger.",
      });

      return data;
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [bookingId, enabled]);

  // Real-time subscription for booking changes (simulating offers)
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
          console.log('📡 Booking update (simulating offers):', payload);
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
    createOffer,
    refresh: fetchOffers
  };
};
