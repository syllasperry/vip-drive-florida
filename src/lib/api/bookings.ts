
import { supabase } from "@/integrations/supabase/client";

export async function getMyPassengerBookings() {
  try {
    // Use manual RPC call since the function might not be in the generated types yet
    const { data, error } = await supabase.rpc('get_my_passenger_bookings');
    
    if (error) {
      console.error('Error fetching passenger bookings:', error);
      throw error;
    }

    console.log('Passenger bookings fetched:', Array.isArray(data) ? data.length : 0, 'bookings');
    
    // Ensure we always return an array
    if (!data) return [];
    if (!Array.isArray(data)) return [];
    
    return data;
  } catch (error) {
    console.error('Unexpected error in getMyPassengerBookings:', error);
    throw error;
  }
}
