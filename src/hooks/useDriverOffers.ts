
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBookingStore } from '@/stores/bookingStore';

interface DriverOffer {
  id: string;
  booking_id: string;
  driver_id: string;
  offer_price: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at?: string;
  updated_at: string;
}

interface UseDriverOffersOptions {
  bookingId: string | null;
  enabled?: boolean;
}

export const useDriverOffers = ({ bookingId, enabled = true }: UseDriverOffersOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    driverOffers, 
    setDriverOffers, 
    subscribeToDriverOffers, 
    unsubscribeFromBooking 
  } = useBookingStore();
  
  const offers = bookingId ? driverOffers[bookingId] || [] : [];

  const fetchOffers = async () => {
    if (!bookingId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching driver offers for booking:', bookingId);
      
      const { data, error } = await supabase
        .from('driver_offers')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('📊 Driver offers fetched:', data);
      setDriverOffers(bookingId, data || []);
    } catch (err) {
      console.error('❌ Error fetching driver offers:', err);
      setError('Failed to fetch driver offers');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and subscription setup
  useEffect(() => {
    if (!bookingId || !enabled) return;

    fetchOffers();
    subscribeToDriverOffers(bookingId);

    return () => {
      unsubscribeFromBooking(bookingId);
    };
  }, [bookingId, enabled]);

  const createOffer = async (offerPrice: number, expiresInHours = 24) => {
    if (!bookingId) throw new Error('No booking ID provided');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { data, error } = await supabase
      .from('driver_offers')
      .insert({
        booking_id: bookingId,
        driver_id: (await supabase.auth.getUser()).data.user?.id!,
        offer_price: offerPrice,
        status: 'pending',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Driver offer created:', data);
    return data;
  };

  const acceptOffer = async (offerId: string) => {
    const { error } = await supabase
      .from('driver_offers')
      .update({ status: 'accepted' })
      .eq('id', offerId);

    if (error) throw error;
    
    console.log('✅ Driver offer accepted:', offerId);
  };

  const declineOffer = async (offerId: string) => {
    const { error } = await supabase
      .from('driver_offers')
      .update({ status: 'declined' })
      .eq('id', offerId);

    if (error) throw error;
    
    console.log('❌ Driver offer declined:', offerId);
  };

  return {
    offers,
    loading,
    error,
    refresh: fetchOffers,
    createOffer,
    acceptOffer,
    declineOffer
  };
};
