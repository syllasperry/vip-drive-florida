
import { supabase } from "@/integrations/supabase/client";

export const normalizeBookingStatus = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'pending_driver':
      return 'pending';
    case 'assigned':
    case 'driver_assigned':
    case 'assigned_by_dispatcher':
      return 'assigned';
    case 'offer_sent':
    case 'price_awaiting_acceptance':
      return 'offer_sent';
    case 'offer_accepted':
    case 'passenger_paid':
    case 'payment_confirmed':
      return 'offer_accepted';
    case 'all_set':
      return 'all_set';
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

export const mapToSimpleStatus = (booking: any): string => {
  // Priority order for status determination
  if (booking.ride_stage === 'completed' || booking.status === 'completed') {
    return 'completed';
  }
  
  if (booking.ride_stage === 'cancelled' || booking.status === 'cancelled') {
    return 'cancelled';
  }
  
  if (['driver_heading_to_pickup', 'driver_arrived_at_pickup', 'passenger_onboard', 'in_transit'].includes(booking.ride_stage)) {
    return 'in_progress';
  }
  
  if (booking.payment_confirmation_status === 'all_set') {
    return 'all_set';
  }
  
  if (booking.payment_confirmation_status === 'passenger_paid' || booking.status_passenger === 'payment_confirmed') {
    return 'offer_accepted';
  }
  
  if (booking.final_price && booking.final_price > 0) {
    return 'offer_sent';
  }
  
  if (booking.driver_id) {
    return 'assigned';
  }
  
  return 'pending';
};

export const updateBookingStatus = async (bookingId: string, updates: any) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

export const getBookingStatusDisplay = (booking: any): { status: string; color: string } => {
  const simpleStatus = mapToSimpleStatus(booking);
  
  switch (simpleStatus) {
    case 'pending':
      return { status: 'Pending Driver', color: 'bg-orange-100 text-orange-800' };
    case 'assigned':
      return { status: 'Driver Assigned', color: 'bg-blue-100 text-blue-800' };
    case 'offer_sent':
      return { status: 'Offer Sent', color: 'bg-purple-100 text-purple-800' };
    case 'offer_accepted':
      return { status: 'Payment Confirmed', color: 'bg-green-100 text-green-800' };
    case 'all_set':
      return { status: 'All Set', color: 'bg-emerald-100 text-emerald-800' };
    case 'in_progress':
      return { status: 'In Progress', color: 'bg-indigo-100 text-indigo-800' };
    case 'completed':
      return { status: 'Completed', color: 'bg-gray-100 text-gray-800' };
    case 'cancelled':
      return { status: 'Cancelled', color: 'bg-red-100 text-red-800' };
    default:
      return { status: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
};
