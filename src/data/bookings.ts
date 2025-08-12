
import { supabase } from "@/integrations/supabase/client";
import { updateBookingStatus, mapToSimpleStatus } from "@/utils/bookingHelpers";

// Re-export functions that other components expect
export { updateBookingStatus, mapToSimpleStatus };

export const sendOffer = async (bookingId: string, driverId: string, price: number) => {
  const { error } = await supabase
    .from('bookings')
    .update({ 
      driver_id: driverId,
      final_price: price,
      status: 'driver_offered'
    })
    .eq('id', bookingId);
  
  if (error) throw error;
};

export const getDispatcherBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getAllBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getBookings = getAllBookings;

export const listenForBookingChanges = (callback: (payload: any) => void) => {
  return supabase
    .channel('bookings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, callback)
    .subscribe();
};
