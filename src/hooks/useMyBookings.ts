
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  drivers?: {
    full_name: string;
    phone: string;
    car_make: string | null;
    car_model: string | null;
    car_color: string | null;
    license_plate: string | null;
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

      // Now fetch bookings for this passenger with payment fields
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
          stripe_payment_intent_id,
          drivers:driver_id (
            full_name,
            phone,
            car_make,
            car_model,
            car_color,
            license_plate,
            avatar_url,
            profile_photo_url,
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
      
      // Map the raw data to ensure type safety and proper payment status detection
      const bookings: Booking[] = (rawBookings || []).map(booking => ({
        ...booking,
        drivers: booking.drivers && typeof booking.drivers === 'object' && !Array.isArray(booking.drivers) 
          ? booking.drivers 
          : null
      }));

      return bookings;
    },
    retry: 2,
    refetchOnWindowFocus: true,
    // CRITICAL FIX: Faster polling for payment status updates
    refetchInterval: (data) => {
      // Faster polling if there are pending payments
      const hasPendingPayments = data?.some(booking => 
        booking.payment_status === 'processing' ||
        booking.payment_confirmation_status === 'price_awaiting_acceptance' ||
        booking.status === 'offer_sent'
      );
      return hasPendingPayments ? 1000 : 5000; // 1s for pending, 5s for stable
    },
    refetchIntervalInBackground: true
  });

  return {
    bookings,
    isLoading,
    error,
    refetch
  };
};
