
import { supabase } from "@/integrations/supabase/client";

export interface DispatcherBookingData {
  booking_id: string;
  status: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_name: string;
  passenger_phone: string;
  driver_name?: string;
  driver_phone?: string;
  final_price?: number;
}

export const getDispatcherBookings = async (): Promise<DispatcherBookingData[]> => {
  try {
    // Use direct query to bookings table with joins
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        pickup_time,
        pickup_location,
        dropoff_location,
        final_price,
        passengers!inner (
          full_name,
          phone
        ),
        drivers (
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching dispatcher bookings:', error);
      throw error;
    }

    return (data || []).map(booking => ({
      booking_id: booking.id,
      status: booking.status || 'pending',
      pickup_time: booking.pickup_time,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      passenger_name: booking.passengers?.full_name || 'Unknown',
      passenger_phone: booking.passengers?.phone || '',
      driver_name: booking.drivers?.full_name || null,
      driver_phone: booking.drivers?.phone || null,
      final_price: booking.final_price
    }));
  } catch (error) {
    console.error('Error in getDispatcherBookings:', error);
    return [];
  }
};

export const getPassengerBookings = async () => {
  try {
    // Use direct query to bookings table for current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        pickup_time,
        pickup_location,
        dropoff_location,
        final_price,
        created_at,
        passenger_id,
        driver_id,
        drivers (
          full_name,
          phone
        )
      `)
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching passenger bookings:', error);
      throw error;
    }

    return (data || []).map(booking => ({
      booking_id: booking.id,
      status: booking.status || 'pending',
      pickup_time: booking.pickup_time,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      driver_name: booking.drivers?.full_name || null,
      driver_phone: booking.drivers?.phone || null,
      final_price: booking.final_price,
      created_at: booking.created_at,
      passenger_id: booking.passenger_id,
      driver_id: booking.driver_id
    }));
  } catch (error) {
    console.error('Error in getPassengerBookings:', error);
    return [];
  }
};
