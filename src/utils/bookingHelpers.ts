import { supabase } from "@/integrations/supabase/client";

export const normalizeBookingStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'pending_driver':
      return 'pending';
    case 'driver_accepted':
    case 'accepted_by_driver':
      return 'accepted';
    case 'offer_sent':
      return 'offer_sent';
    case 'offer_accepted':
      return 'offer_accepted';
    case 'all_set':
      return 'confirmed';
    case 'in_progress':
    case 'driver_heading_to_pickup':
    case 'driver_arrived_at_pickup':
    case 'passenger_onboard':
    case 'in_transit':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return status || 'pending';
  }
};

export const mapToSimpleStatus = (status: string): string => {
  const normalized = normalizeBookingStatus(status);
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'accepted':
      return 'Accepted';
    case 'offer_sent':
      return 'Offer Sent';
    case 'offer_accepted':
      return 'Offer Accepted';
    case 'confirmed':
      return 'Confirmed';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
