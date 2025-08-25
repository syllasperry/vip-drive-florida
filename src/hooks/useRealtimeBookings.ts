
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';

export const useRealtimeBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching bookings with improved error handling...');
      
      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ No authenticated user found:', userError);
        setError('User not authenticated');
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log('✅ User authenticated:', user.email);

      // Get passenger profile first
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

      // Fetch bookings with safe query structure
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

      console.log('✅ Bookings fetched successfully:', data?.length || 0, 'bookings');
      
      // Transform data to match expected Booking type
      const transformedBookings: Booking[] = (data || []).map(booking => ({
        ...booking,
        passengers: booking.passengers && typeof booking.passengers === 'object' && !Array.isArray(booking.passengers) 
          ? booking.passengers 
          : undefined,
        drivers: null // Will be populated separately if needed
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

    // Set up real-time subscription for passenger's bookings only
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && mounted) {
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
              console.log('📡 Real-time booking update:', payload);
              // Refresh bookings when any change occurs
              if (mounted) {
                fetchBookings();
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 Passenger bookings subscription status:', status);
          });

        return () => {
          console.log('🧹 Cleaning up passenger bookings subscription');
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

  // Manual refresh function
  const refetch = async () => {
    console.log('🔄 Manual refresh triggered for passenger bookings');
    await fetchBookings();
  };

  return { bookings, loading, error, refetch };
};
