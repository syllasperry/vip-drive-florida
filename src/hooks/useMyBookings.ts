
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
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current || !mountedRef.current) {
      console.log('🚫 Skipping fetch - already in progress or unmounted');
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      console.log('🔄 Fetching passenger bookings...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !mountedRef.current) {
        console.log('❌ No authenticated user for bookings');
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get passenger record first
      const { data: passengerData, error: passengerError } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (passengerError || !passengerData || !mountedRef.current) {
        console.log('❌ No passenger profile found for bookings');
        setBookings([]);
        setError(null); // Not really an error, just no profile yet
        setLoading(false);
        return;
      }

      // Get bookings using passenger_id
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
            full_name,
            phone
          )
        `)
        .eq('passenger_id', passengerData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        if (mountedRef.current) {
          setError(error.message);
          setBookings([]);
        }
        return;
      }

      if (!mountedRef.current) return;

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
      }
    } catch (err) {
      console.error('❌ Error in fetchBookings:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
        setBookings([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchBookings();

    // Set up real-time subscription with controlled updates
    let debounceTimeout: NodeJS.Timeout;
    
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
          console.log('📡 Booking realtime update received:', payload);
          
          // Debounce rapid updates to prevent excessive API calls
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            if (mountedRef.current && !fetchingRef.current) {
              fetchBookings();
            }
          }, 1000); // 1 second debounce
        }
      )
      .subscribe((status) => {
        console.log('📡 Passenger bookings subscription status:', status);
      });

    return () => {
      mountedRef.current = false;
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
      console.log('🧹 Cleaning up passenger bookings subscription');
    };
  }, []); // Empty dependency array - only run once

  const refetch = () => {
    if (mountedRef.current && !fetchingRef.current) {
      console.log('🔄 Manual refetch triggered');
      setLoading(true);
      fetchBookings();
    }
  };

  return {
    bookings,
    loading,
    error,
    refetch
  };
};
