
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
      const { data, error } = await supabase
        .from('driver_offers')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOffers(data || []);
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
      const { data, error } = await supabase
        .from('driver_offers')
        .insert({
          ...offerData,
          status: 'offer_sent'
        })
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

  // Real-time subscription for offers
  useEffect(() => {
    if (!bookingId || !enabled) return;

    const channel = supabase
      .channel(`offers-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_offers',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Offer update:', payload);
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
