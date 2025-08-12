
import { supabase } from "@/integrations/supabase/client";
import { Booking } from "@/types/booking";

// Remove the import that conflicts with utils/bookingHelpers
const normalizeBookingStatusLocal = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'booking_requested',
    'assigned': 'booking_requested', 
    'offer_sent': 'payment_pending',
    'offer_accepted': 'all_set',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  
  return statusMap[status] || status;
};

export const fetchBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passengers (
        id,
        full_name,
        phone,
        profile_photo_url
      ),
      drivers (
        full_name,
        phone,
        profile_photo_url,
        car_make,
        car_model,
        car_color,
        license_plate
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(booking => ({
    ...booking,
    simple_status: normalizeBookingStatusLocal(booking.status) as any
  }));
};

// Re-export the functions that other components need
export const getAllBookings = fetchBookings;

export const listenForBookingChanges = (callback: (bookings: Booking[]) => void) => {
  const channel = supabase
    .channel('bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
      fetchBookings().then(callback);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const sendOffer = async (bookingId: string, driverId: string, offer: any) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      driver_id: driverId,
      final_price: offer.price,
      status: 'offer_sent',
      ride_status: 'offer_sent',
      payment_confirmation_status: 'price_awaiting_acceptance'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
