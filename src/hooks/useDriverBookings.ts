
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleBooking } from '@/types/dashboard';
import { transformSupabaseBooking } from '@/utils/bookingTransformer';
import { useToast } from '@/hooks/use-toast';

export const useDriverBookings = (driverId: string | null) => {
  const [bookings, setBookings] = useState<SimpleBooking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<SimpleBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadBookings = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            full_name,
            phone,
            profile_photo_url
          )
        `)
        .eq('driver_id', userId)
        .not('status', 'in', '(completed,cancelled,declined)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const rawBookings = data || [];
      const transformedData: SimpleBooking[] = rawBookings.map((booking: any) => 
        transformSupabaseBooking(booking)
      );
      
      setBookings(transformedData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load bookings');
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCompletedBookings = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            full_name,
            phone,
            profile_photo_url
          )
        `)
        .eq('driver_id', userId)
        .in('status', ['completed', 'cancelled', 'declined'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      const rawBookings = data || [];
      const transformedData: SimpleBooking[] = rawBookings.map((booking: any) => 
        transformSupabaseBooking(booking)
      );
      
      setCompletedBookings(transformedData);
    } catch (error) {
      console.error('Error loading completed bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load ride history",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (driverId) {
      loadBookings(driverId);
      loadCompletedBookings(driverId);
    }
  }, [driverId, loadBookings, loadCompletedBookings]);

  const refreshBookings = useCallback(() => {
    if (driverId) {
      loadBookings(driverId);
      loadCompletedBookings(driverId);
    }
  }, [driverId, loadBookings, loadCompletedBookings]);

  const updateBooking = useCallback((updatedBooking: SimpleBooking) => {
    setBookings(prev => {
      const index = prev.findIndex(b => b.id === updatedBooking.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = updatedBooking;
        return updated;
      }
      return [updatedBooking, ...prev];
    });
  }, []);

  return {
    bookings,
    completedBookings,
    loading,
    error,
    refreshBookings,
    updateBooking
  };
};
