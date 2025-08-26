
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';
import { toast } from '@/hooks/use-toast';

export const useRealtimeBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching bookings with enhanced offer/payment handling...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ No authenticated user found:', userError);
        setError('User not authenticated');
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log('✅ User authenticated:', user.email);

      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (passengerError && passengerError.code !== 'PGRST116') {
        console.error('❌ Error fetching passenger:', passengerError);
        setError(`Failed to fetch passenger: ${passengerError.message}`);
        setBookings([]);
        setLoading(false);
        return;
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
          setError(`Failed to create passenger: ${createError.message}`);
          setBookings([]);
          setLoading(false);
          return;
        }
        passenger = newPassenger;
      }

      // Enhanced query to include driver information for offers
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers!inner (
            id,
            full_name,
            phone,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          ),
          drivers (
            id,
            full_name,
            phone,
            profile_photo_url,
            car_make,
            car_model,
            car_color,
            license_plate
          )
        `)
        .eq('passenger_id', passenger.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        setError(`Failed to fetch bookings: ${error.message}`);
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log('✅ Enhanced bookings fetched successfully:', data?.length || 0, 'bookings');
      
      const transformedBookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        passengers: booking.passengers && typeof booking.passengers === 'object' && !Array.isArray(booking.passengers) 
          ? booking.passengers 
          : undefined,
        drivers: booking.drivers && typeof booking.drivers === 'object' && !Array.isArray(booking.drivers)
          ? booking.drivers
          : null
      }));

      setBookings(transformedBookings);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('❌ Unexpected error in fetchBookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    fetchBookings();

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && mounted) {
        const channel = supabase
          .channel('passenger_bookings_enhanced_realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookings'
            },
            (payload) => {
              console.log('📡 Enhanced real-time booking update:', payload);
              
              if (payload.eventType === 'UPDATE' && payload.new) {
                const newBooking = payload.new;
                const oldBooking = payload.old;
                
                // Handle offer sent by dispatcher
                if (
                  (newBooking.status === 'offer_sent' && oldBooking?.status !== 'offer_sent') ||
                  (newBooking.ride_status === 'offer_sent' && oldBooking?.ride_status !== 'offer_sent') ||
                  (newBooking.payment_confirmation_status === 'price_awaiting_acceptance' && 
                   oldBooking?.payment_confirmation_status !== 'price_awaiting_acceptance')
                ) {
                  console.log('🎯 Offer received for booking:', newBooking.id);
                  
                  const finalPrice = newBooking.final_price_cents 
                    ? (newBooking.final_price_cents / 100).toFixed(2)
                    : newBooking.final_price?.toFixed(2) 
                    || newBooking.estimated_price?.toFixed(2) 
                    || '0.00';
                  
                  toast({
                    title: "Offer Received!",
                    description: `You have received a price offer of $${finalPrice} for your ride. Please proceed with payment.`,
                  });
                }

                // Handle successful payment
                if (
                  (newBooking.payment_status === 'paid' && oldBooking?.payment_status !== 'paid') ||
                  (newBooking.payment_confirmation_status === 'passenger_paid' && 
                   oldBooking?.payment_confirmation_status !== 'passenger_paid')
                ) {
                  console.log('💳 Payment successful for booking:', newBooking.id);
                  
                  toast({
                    title: "Payment Successful!",
                    description: "Your payment has been processed. You'll receive a confirmation email shortly.",
                  });
                }

                // Handle booking fully confirmed
                if (
                  newBooking.payment_confirmation_status === 'all_set' && 
                  oldBooking?.payment_confirmation_status !== 'all_set'
                ) {
                  console.log('✅ Booking fully confirmed:', newBooking.id);
                  
                  toast({
                    title: "Ride Confirmed!",
                    description: "Your ride is confirmed. Your driver will contact you soon.",
                  });
                }
              }
              
              // Refresh bookings for any change
              if (mounted) {
                fetchBookings();
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Enhanced passenger bookings subscription status:', status);
          });

        return () => {
          console.log('🧹 Cleaning up enhanced passenger bookings subscription');
          supabase.removeChannel(channel);
        };
      }
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  const refetch = async () => {
    console.log('🔄 Manual refresh triggered for enhanced passenger bookings');
    await fetchBookings();
  };

  return { bookings, loading, error, refetch };
};
