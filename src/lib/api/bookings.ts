
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
    // Try to use the RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_dispatcher_bookings_by_auth');
    
    if (!rpcError && rpcData) {
      return rpcData as DispatcherBookingData[];
    }

    // Fallback to direct query with joins
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
    const { data, error } = await supabase.rpc('get_my_passenger_bookings');
    
    if (error) {
      console.error('Error fetching passenger bookings:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPassengerBookings:', error);
    return [];
  }
};
