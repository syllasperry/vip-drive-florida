import { supabase } from "@/integrations/supabase/client";

export const normalizeBookingStatus = (status: string): string => {
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

export const mapToSimpleStatus = (status: string): "completed" | "cancelled" | "payment_pending" | "all_set" | "booking_requested" => {
  const normalizedStatus = normalizeBookingStatus(status);
  
  switch (normalizedStatus) {
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'payment_pending':
      return 'payment_pending';
    case 'all_set':
      return 'all_set';
    default:
      return 'booking_requested';
  }
};

export const updateBookingStatus = async (bookingId: string, newStatus: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: newStatus })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBookingStatusDisplay = (status: string): string => {
  const displayMap: Record<string, string> = {
    'booking_requested': 'Booking Requested',
    'payment_pending': 'Payment Pending',
    'all_set': 'All Set',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  return displayMap[status] || status;
};

export const getBookingStatusHistory = (bookingId: string) => {
  // Placeholder function for status history
  return [];
};
