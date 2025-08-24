
import { useState, useEffect, useRef } from 'react';
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
  
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchBookings = async () => {
    if (fetchingRef.current || !mountedRef.current) {
      console.log('🚫 Fetch blocked - already fetching or unmounted');
      return;
    }
    
    fetchingRef.current = true;
    console.log('🔄 Starting fetchBookings with new view...');
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!user?.id) {
        console.log('❌ No authenticated user');
        if (mountedRef.current) {
          setBookings([]);
          setError('User not authenticated');
          setLoading(false);
        }
        return;
      }

      console.log('✅ User authenticated:', user.id, user.email);

      // Use the new corrected view
      const { data: viewData, error: viewError } = await supabase
        .from('my_passenger_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (viewError) {
        console.error('❌ Error fetching from view:', viewError);
        // Fallback to manual query if view fails
        const { data: manualData, error: manualError } = await supabase
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
            passengers!inner (
              user_id,
              full_name
            ),
            drivers (
              full_name,
              phone
            )
          `)
          .eq('passengers.user_id', user.id)
          .order('created_at', { ascending: false });

        if (manualError) {
          console.error('❌ Manual query also failed:', manualError);
          throw new Error(`Bookings fetch error: ${manualError.message}`);
        }

        const formattedBookings: MyBooking[] = (manualData || []).map(booking => ({
          id: booking.id,
          booking_code: booking.booking_code,
          status: booking.status || 'pending',
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          pickup_time: booking.pickup_time,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          driver_id: booking.driver_id,
          driver_name: booking.drivers?.full_name,
          driver_phone: booking.drivers?.phone,
          estimated_price: booking.estimated_price,
          final_price: booking.final_price,
          price_cents: booking.final_price_cents || booking.estimated_price_cents,
          vehicle_type: booking.vehicle_type,
          distance_miles: booking.distance_miles
        }));

        if (mountedRef.current) {
          setBookings(formattedBookings);
          setError(null);
          setLoading(false);
          console.log('✅ Manual query successful with', formattedBookings.length, 'bookings');
        }
        return;
      }

      console.log('📊 View data from Supabase:', viewData);
      console.log('📊 Number of bookings from view:', viewData?.length || 0);

      if (!mountedRef.current) return;

      const formattedBookings: MyBooking[] = (viewData || []).map(booking => ({
        id: booking.booking_id,
        booking_code: booking.booking_code,
        status: booking.status || 'pending',
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        driver_id: booking.driver_id,
        driver_name: booking.driver_name,
        estimated_price: booking.price_dollars,
        final_price: booking.price_dollars,
        price_cents: booking.price_cents,
        vehicle_type: booking.vehicle_type,
        distance_miles: booking.distance_miles
      }));

      console.log('✅ Final formatted bookings:', formattedBookings.length, 'bookings');

      if (mountedRef.current) {
        setBookings(formattedBookings);
        setError(null);
        setLoading(false);
        console.log('✅ State updated successfully with', formattedBookings.length, 'bookings');
      }

    } catch (err) {
      console.error('❌ Error in fetchBookings:', err);
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch bookings';
        setError(errorMessage);
        setBookings([]);
        setLoading(false);
      }
    } finally {
      fetchingRef.current = false;
      console.log('🏁 fetchBookings completed');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    console.log('🚀 useMyBookings hook initialized');
    
    // Initial fetch
    fetchBookings();

    // Set up real-time subscription for bookings table
    const channel = supabase
      .channel('passenger_bookings_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Realtime booking update:', payload);
          // Refetch after a short delay to ensure data consistency
          setTimeout(() => {
            if (mountedRef.current && !fetchingRef.current) {
              console.log('🔄 Triggering refetch from realtime update');
              fetchBookings();
            }
          }, 500);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      mountedRef.current = false;
      fetchingRef.current = false;
      supabase.removeChannel(channel);
      console.log('🧹 useMyBookings cleanup completed');
    };
  }, []);

  const refetch = async () => {
    if (mountedRef.current) {
      console.log('🔄 Manual refetch triggered');
      setLoading(true);
      await fetchBookings();
    }
  };

  console.log('📊 useMyBookings returning:', { bookings: bookings.length, loading, error });

  return {
    bookings,
    loading,
    error,
    refetch
  };
};
