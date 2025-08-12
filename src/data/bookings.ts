
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
