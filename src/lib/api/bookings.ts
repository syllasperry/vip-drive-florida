
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    const { data, error } = await supabase.rpc('get_my_passenger_bookings');
    
    if (error) {
      console.error('Error fetching passenger bookings:', error);
      throw error;
    }

    console.log('Passenger bookings fetched:', data?.length || 0, 'bookings');
    return data ?? [];
  } catch (error) {
    console.error('Unexpected error in getMyPassengerBookings:', error);
    throw error;
  }
}
