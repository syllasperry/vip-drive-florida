
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MyBooking {
  id: string;
  booking_code?: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  created_at: string;
  updated_at: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  estimated_price?: number;
  final_price?: number;
  price_cents?: number;
  vehicle_type?: string;
  distance_miles?: number;
}

export const useMyBookings = () => {
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching my bookings...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.log('❌ No authenticated user');
        setBookings([]);
        return;
      }

      console.log('✅ User authenticated for bookings:', user.id);

      // Get bookings directly using user_id (which is stored in passengers table)
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          status,
          pickup_location,
          dropoff_location,
          pickup_time,
          created_at,
          updated_at,
          driver_id,
          estimated_price,
          final_price,
          estimated_price_cents,
          final_price_cents,
          vehicle_type,
          distance_miles,
          drivers!driver_id(
            full_name
          ),
          passengers!passenger_id(
            user_id,
            full_name
          )
        `)
        .eq('passengers.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        
        // Try alternative approach using passengers table join
        const { data: passengerData } = await supabase
          .from('passengers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (passengerData) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              id,
              booking_code,
              status,
              pickup_location,
              dropoff_location,
              pickup_time,
              created_at,
              updated_at,
              driver_id,
              estimated_price,
              final_price,
              estimated_price_cents,
              final_price_cents,
              vehicle_type,
              distance_miles,
              drivers!driver_id(
                full_name
              )
            `)
            .eq('passenger_id', passengerData.id)
            .order('created_at', { ascending: false });

          if (bookingsError) {
            throw bookingsError;
          }

          const formattedBookings: MyBooking[] = (bookingsData || []).map(booking => ({
            id: booking.id,
            booking_code: booking.booking_code,
            status: booking.status,
            pickup_location: booking.pickup_location,
            dropoff_location: booking.dropoff_location,
            pickup_time: booking.pickup_time,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            driver_id: booking.driver_id,
            driver_name: booking.drivers?.full_name,
            estimated_price: booking.estimated_price,
            final_price: booking.final_price,
            price_cents: booking.final_price_cents || booking.estimated_price_cents,
            vehicle_type: booking.vehicle_type,
            distance_miles: booking.distance_miles
          }));

          console.log('✅ Bookings fetched with alternative approach:', formattedBookings.length);
          setBookings(formattedBookings);
          return;
        }
        
        throw error;
      }

      console.log('✅ Bookings fetched successfully:', data?.length || 0);

      const formattedBookings: MyBooking[] = (data || []).map(booking => ({
        id: booking.id,
        booking_code: booking.booking_code,
        status: booking.status,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        driver_id: booking.driver_id,
        driver_name: booking.drivers?.full_name,
        estimated_price: booking.estimated_price,
        final_price: booking.final_price,
        price_cents: booking.final_price_cents || booking.estimated_price_cents,
        vehicle_type: booking.vehicle_type,
        distance_miles: booking.distance_miles
      }));

      setBookings(formattedBookings);
    } catch (err) {
      console.error('❌ Error in fetchBookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription for booking updates
    const channel = supabase
      .channel('my_bookings_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Booking update received:', payload);
          fetchBookings(); // Refetch bookings on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    bookings,
    loading,
    error,
    refetch: fetchBookings
  };
};
