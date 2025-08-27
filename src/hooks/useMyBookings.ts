
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface Booking {
  id: string;
  booking_code: string | null;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  created_at: string;
  updated_at: string;
  passenger_id: string;
  driver_id: string | null;
  vehicle_type: string | null;
  final_price: number | null;
  estimated_price: number | null;
  payment_confirmation_status: string | null;
  payment_status: string | null;
  ride_status: string | null;
  passenger_count: number;
  luggage_count: number;
  flight_info: string | null;
  offer_price_cents: number | null;
  paid_amount_cents: number | null;
  paid_at: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  paid_currency: string | null;
  final_price_cents: number | null;
  estimated_price_cents: number | null;
  drivers?: {
    full_name: string;
    phone: string;
    car_make: string | null;
    car_model: string | null;
    car_color: string | null;
    license_plate: string | null;
    profile_photo_url: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
}

export const useMyBookings = () => {
  const { data: bookings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async (): Promise<Booking[]> => {
      console.log('🔄 Fetching passenger bookings...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user');
        return [];
      }

      // First, get or create passenger profile
      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (passengerError && passengerError.code !== 'PGRST116') {
        console.error('❌ Error fetching passenger:', passengerError);
        throw passengerError;
      }

      if (!passenger) {
        console.log('🔨 Creating passenger profile...');
        const { data: newPassenger, error: createError } = await supabase
          .from('passengers')
          .insert([{
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          }])
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating passenger:', createError);
          throw createError;
        }
        passenger = newPassenger;
      }

      // Fetch bookings with comprehensive payment and driver data
      const { data: rawBookings, error: bookingsError } = await supabase
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
          passenger_id,
          driver_id,
          vehicle_type,
          final_price,
          estimated_price,
          payment_confirmation_status,
          payment_status,
          ride_status,
          passenger_count,
          luggage_count,
          flight_info,
          offer_price_cents,
          paid_amount_cents,
          paid_at,
          payment_provider,
          payment_reference,
          paid_currency,
          final_price_cents,
          estimated_price_cents,
          stripe_payment_intent_id,
          drivers:driver_id (
            full_name,
            phone,
            car_make,
            car_model,
            car_color,
            license_plate,
            profile_photo_url,
            avatar_url,
            email
          )
        `)
        .eq('passenger_id', passenger.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      console.log('✅ Bookings fetched successfully:', rawBookings?.length || 0);
      
      // Map and validate the data
      const bookings: Booking[] = (rawBookings || []).map(booking => ({
        ...booking,
        drivers: booking.drivers && typeof booking.drivers === 'object' && !Array.isArray(booking.drivers) 
          ? booking.drivers 
          : null
      }));

      // CRITICAL: Enhanced payment status debugging and correction
      const processedBookings = bookings.map(booking => {
        // Multiple ways to determine if booking is paid
        const isPaidByStatus = booking.status === 'paid'
        const isPaidByPaymentStatus = booking.payment_status === 'paid'
        const isPaidByPaidAt = !!booking.paid_at
        const isPaidByAmount = booking.paid_amount_cents && booking.paid_amount_cents > 0
        const isPaidByProvider = !!booking.payment_provider
        
        const isPaid = isPaidByStatus || isPaidByPaymentStatus || isPaidByPaidAt || isPaidByAmount || isPaidByProvider
        
        // Debug logging for each booking
        console.log(`📊 Booking ${booking.id.slice(-8)} payment analysis:`, {
          booking_code: booking.booking_code,
          status: booking.status,
          payment_status: booking.payment_status,
          paid_at: booking.paid_at,
          paid_amount_cents: booking.paid_amount_cents,
          payment_provider: booking.payment_provider,
          payment_reference: booking.payment_reference,
          offer_price_cents: booking.offer_price_cents,
          isPaidCalculated: isPaid,
          conditions: {
            isPaidByStatus,
            isPaidByPaymentStatus,
            isPaidByPaidAt,
            isPaidByAmount,
            isPaidByProvider
          }
        })
        
        return {
          ...booking,
          // Add a computed field for easier access
          isPaymentConfirmed: isPaid
        }
      })

      return processedBookings;
    },
    retry: 3,
    refetchOnWindowFocus: true,
    // Faster refetch for payment status updates
    refetchInterval: 2000, // Every 2 seconds for rapid response
    staleTime: 0 // Always consider data stale for immediate updates
  });

  // Set up realtime subscription for booking updates
  useEffect(() => {
    const channel = supabase
      .channel('booking-payment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Realtime booking update received:', payload);
          // Force immediate refetch when booking is updated
          refetch();
        }
      )
      .subscribe();

    console.log('📡 Realtime subscription established for booking updates');

    return () => {
      console.log('📡 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    bookings,
    isLoading,
    error,
    refetch
  };
};
