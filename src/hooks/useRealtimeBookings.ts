
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';

export const useRealtimeBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBookings = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching bookings with improved error handling...');
        
        // Get current user first
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('❌ No authenticated user found:', userError);
          if (mounted) {
            setError('User not authenticated');
            setBookings([]);
            setLoading(false);
          }
          return;
        }

        console.log('✅ User authenticated:', user.email);

        // Fetch bookings with safer query structure
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
          .eq('passenger_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching bookings:', error);
          // Try fallback query without drivers join if main query fails
          console.log('🔄 Attempting fallback query without drivers...');
          
          const { data: fallbackData, error: fallbackError } = await supabase
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
            .eq('passenger_id', user.id)
            .order('created_at', { ascending: false });

          if (fallbackError) {
            console.error('❌ Fallback query also failed:', fallbackError);
            if (mounted) {
              setError(`Failed to fetch bookings: ${fallbackError.message}`);
              setBookings([]);
            }
            return;
          }

          if (mounted) {
            console.log('✅ Fallback bookings fetched successfully:', fallbackData?.length || 0, 'bookings');
            const safeData = Array.isArray(fallbackData) ? fallbackData : [];
            setBookings(safeData);
            setError(null);
          }
          return;
        }

        if (mounted) {
          console.log('✅ Bookings fetched successfully:', data?.length || 0, 'bookings');
          const safeData = Array.isArray(data) ? data : [];
          setBookings(safeData);
          setError(null);
        }
      } catch (err) {
        console.error('❌ Unexpected error in fetchBookings:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
          setBookings([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    // Set up real-time subscription for passenger's bookings only
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const channel = supabase
        .channel('passenger_bookings_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `passenger_id=eq.${user.id}`
          },
          (payload) => {
            console.log('📡 Real-time booking update for passenger:', payload);
            
            // Refresh bookings when any change occurs to passenger's bookings
            fetchBookings();
          }
        )
        .subscribe((status) => {
          console.log('📡 Passenger bookings subscription status:', status);
        });

      return () => {
        mounted = false;
        console.log('🧹 Cleaning up passenger bookings subscription');
        supabase.removeChannel(channel);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Manual refresh function
  const refetch = async () => {
    console.log('🔄 Manual refresh triggered for passenger bookings');
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('User not authenticated');
        setBookings([]);
        setLoading(false);
        return;
      }

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
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error in manual refresh:', error);
        // Try fallback without drivers
        const { data: fallbackData, error: fallbackError } = await supabase
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
          .eq('passenger_id', user.id)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          setError(`Failed to refresh bookings: ${fallbackError.message}`);
          setBookings([]);
        } else {
          const safeData = Array.isArray(fallbackData) ? fallbackData : [];
          setBookings(safeData);
          setError(null);
          console.log('✅ Manual refresh completed with fallback');
        }
      } else {
        const safeData = Array.isArray(data) ? data : [];
        setBookings(safeData);
        setError(null);
        console.log('✅ Manual refresh completed');
      }
    } catch (err) {
      console.error('❌ Error in manual refresh:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  return { bookings, loading, error, refetch };
};
