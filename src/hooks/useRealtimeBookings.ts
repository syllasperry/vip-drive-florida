
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface RealtimeBooking {
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
  final_price_cents: number | null;
  estimated_price: number | null;
  estimated_price_cents: number | null;
  offer_price_cents: number | null;
  payment_confirmation_status: string | null;
  ride_status: string | null;
  passenger_count: number;
  luggage_count: number;
  flight_info: string | null;
  passengers?: {
    id: string;
    full_name: string;
    phone: string;
    profile_photo_url: string | null;
    email: string;
    preferred_temperature: number | null;
    music_preference: string | null;
    interaction_preference: string | null;
    trip_purpose: string | null;
    additional_notes: string | null;
  } | null;
  drivers?: {
    full_name: string;
    phone: string;
    car_make: string | null;
    car_model: string | null;
    car_color: string | null;
    license_plate: string | null;
    profile_photo_url: string | null;
  } | null;
}

export const useRealtimeBookings = () => {
  const [isOfferJustReceived, setIsOfferJustReceived] = useState<string | null>(null);

  const { data: bookings = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['realtime-bookings'],
    queryFn: async (): Promise<RealtimeBooking[]> => {
      console.log('🔄 Fetching passenger bookings with realtime...');
      
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
        throw new Error(`Failed to fetch passenger: ${passengerError.message}`);
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
          throw new Error(`Failed to create passenger: ${createError.message}`);
        }
        passenger = newPassenger;
      }

      // Now fetch bookings for this passenger with explicit relationship specification
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
          final_price_cents,
          estimated_price,
          estimated_price_cents,
          offer_price_cents,
          payment_confirmation_status,
          ride_status,
          passenger_count,
          luggage_count,
          flight_info,
          drivers!bookings_driver_id_fkey (
            full_name,
            phone,
            car_make,
            car_model,
            car_color,
            license_plate,
            profile_photo_url
          ),
          passengers!inner (
            id,
            full_name,
            phone,
            email,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          )
        `)
        .eq('passenger_id', passenger.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('❌ Error fetching bookings:', bookingsError);
        throw new Error(`Failed to fetch bookings: ${bookingsError.message}`);
      }

      console.log('✅ Bookings fetched successfully:', rawBookings?.length || 0);
      
      // Map the raw data to ensure type safety
      const bookings: RealtimeBooking[] = (rawBookings || []).map(booking => ({
        ...booking,
        drivers: booking.drivers && typeof booking.drivers === 'object' && !Array.isArray(booking.drivers) 
          ? booking.drivers 
          : null,
        passengers: booking.passengers && typeof booking.passengers === 'object' && !Array.isArray(booking.passengers)
          ? booking.passengers
          : null
      }));

      return bookings;
    },
    retry: 2,
    refetchOnWindowFocus: false
  });

  // Set up real-time subscription
  useEffect(() => {
    console.log('📡 Setting up real-time subscription for passenger bookings...');
    
    const channel = supabase
      .channel('passenger-bookings-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings' 
      }, (payload) => {
        console.log('📡 Real-time booking update received:', payload);
        
        // Check if this is an offer being sent
        if (payload.eventType === 'UPDATE' && payload.new) {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Detect offer reception
          if (
            (newData.status === 'offer_sent' && oldData?.status !== 'offer_sent') ||
            (newData.ride_status === 'offer_sent' && oldData?.ride_status !== 'offer_sent') ||
            (newData.payment_confirmation_status === 'price_awaiting_acceptance' && 
             oldData?.payment_confirmation_status !== 'price_awaiting_acceptance')
          ) {
            console.log('🎯 Offer received for booking:', newData.id);
            setIsOfferJustReceived(newData.id);
            
            // Clear the flag after 3 seconds
            setTimeout(() => {
              setIsOfferJustReceived(null);
            }, 3000);
          }
        }
        
        refetch();
      })
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const errorMessage = error ? error.message : null;

  return {
    bookings,
    loading,
    error: errorMessage,
    refetch,
    isOfferJustReceived
  };
};
