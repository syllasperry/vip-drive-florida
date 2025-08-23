
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
  const lastFetchRef = useRef(0);

  const fetchBookings = async (isManualRefetch = false) => {
    const now = Date.now();
    if (!isManualRefetch && now - lastFetchRef.current < 1000) {
      console.log('🚫 Skipping fetch - too soon since last fetch');
      return;
    }

    if (fetchingRef.current) {
      console.log('🚫 Skipping fetch - already in progress');
      return;
    }

    if (!mountedRef.current) {
      console.log('🚫 Skipping fetch - component unmounted');
      return;
    }
    
    fetchingRef.current = true;
    lastFetchRef.current = now;
    
    try {
      console.log('🔄 Fetching passenger bookings...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.log('❌ No authenticated user for bookings');
        if (mountedRef.current) {
          setBookings([]);
          setError(null);
          setLoading(false);
        }
        return;
      }

      console.log('✅ User authenticated:', user.id);

      // Get or create passenger record
      let { data: passengerData, error: passengerError } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (passengerError) {
        console.error('❌ Error fetching passenger profile:', passengerError);
        throw passengerError;
      }

      if (!passengerData) {
        console.log('⚠️ No passenger profile found, creating one...');
        
        const { data: newPassenger, error: createError } = await supabase
          .from('passengers')
          .insert({
            user_id: user.id,
            full_name: user.email?.split('@')[0] || 'User',
            email: user.email
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating passenger profile:', createError);
          throw createError;
        }

        passengerData = newPassenger;
        console.log('✅ Passenger profile created:', passengerData.id);
      }

      console.log('✅ Using passenger ID:', passengerData.id);

      // Fetch bookings using passenger_id
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
        throw error;
      }

      if (!mountedRef.current) return;

      console.log('✅ Bookings fetched successfully:', data?.length || 0);
      console.log('📊 Bookings data:', data);

      const formattedBookings: MyBooking[] = (data || []).map(booking => ({
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
        console.log('✅ State updated with bookings:', formattedBookings.length);
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

    // Set up real-time subscription
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
          
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            if (mountedRef.current && !fetchingRef.current) {
              fetchBookings();
            }
          }, 1000);
        }
      )
      .subscribe((status) => {
        console.log('📡 Passenger bookings subscription status:', status);
      });

    return () => {
      mountedRef.current = false;
      clearTimeout(debounceTimeout);
      fetchingRef.current = false;
      supabase.removeChannel(channel);
      console.log('🧹 Cleaning up passenger bookings subscription');
    };
  }, []);

  const refetch = async () => {
    if (mountedRef.current) {
      console.log('🔄 Manual refetch triggered');
      setLoading(true);
      await fetchBookings(true);
    }
  };

  return {
    bookings,
    loading,
    error,
    refetch
  };
};
