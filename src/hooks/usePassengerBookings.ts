
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PassengerBooking {
  id: string;
  booking_code: string;
  status: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  created_at: string;
  updated_at: string;
  distance_miles: number | null;
  estimated_price: number | null;
  final_price: number | null;
  vehicle_type: string | null;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  payment_status: string;
}

export const usePassengerBookings = () => {
  const [bookings, setBookings] = useState<PassengerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Fetching bookings for user:', user.id);

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
          distance_miles,
          estimated_price,
          final_price,
          vehicle_type,
          driver_id,
          payment_status,
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

      if (error) {
        console.error('❌ Error fetching bookings:', error);
        throw error;
      }

      console.log('✅ Successfully fetched bookings:', data);

      const formattedBookings = (data || []).map(booking => ({
        id: booking.id,
        booking_code: booking.booking_code || '',
        status: booking.status || 'pending',
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        distance_miles: booking.distance_miles,
        estimated_price: booking.estimated_price,
        final_price: booking.final_price,
        vehicle_type: booking.vehicle_type,
        driver_id: booking.driver_id,
        driver_name: booking.drivers?.full_name || null,
        driver_phone: booking.drivers?.phone || null,
        payment_status: booking.payment_status
      }));

      setBookings(formattedBookings);
    } catch (error) {
      console.error('❌ Error in fetchBookings:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const refetch = () => {
    fetchBookings();
  };

  return {
    bookings,
    loading,
    error,
    refetch
  };
};
