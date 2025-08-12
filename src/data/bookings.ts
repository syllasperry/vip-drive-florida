
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

export const getAllBookings = fetchBookings;

export const listenForBookingChanges = (callback: (bookings: Booking[]) => void) => {
  const channel = supabase
    .channel('booking_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
      fetchBookings().then(callback);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const sendOffer = async (bookingId: string, driverId: string, price: number) => {
  const { error } = await supabase
    .from('bookings')
    .update({
      driver_id: driverId,
      estimated_price: price,
      status: 'offer_sent',
      payment_confirmation_status: 'payment_pending'
    })
    .eq('id', bookingId);

  if (error) throw error;
};
