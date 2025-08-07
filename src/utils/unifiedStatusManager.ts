
// Unified Status Management System
// Single source of truth for all booking status determinations

export interface BookingData {
  id: string;
  status?: string;
  status_passenger?: string;
  status_driver?: string;
  ride_status?: string;
  payment_confirmation_status?: string;
  ride_stage?: string;
  final_price?: number;
  estimated_price?: number;
  unified_status?: string;
}

export type UnifiedStatus = 
  | 'pending'
  | 'driver_accepted'
  | 'offer_sent'
  | 'offer_accepted'
  | 'payment_confirmed'
  | 'all_set'
  | 'driver_heading_to_pickup'
  | 'driver_arrived_at_pickup'
  | 'passenger_onboard'
  | 'in_transit'
  | 'completed'
  | 'cancelled'
  | 'expired';

/**
 * Determines the unified status based on booking data
 * This is the single source of truth for status determination
 */
export const getUnifiedStatus = (booking: BookingData): UnifiedStatus => {
  if (!booking) return 'pending';

  // Use database unified_status if available (future enhancement)
  if (booking.unified_status) {
    return booking.unified_status as UnifiedStatus;
  }

  // Priority-based status determination
  // Higher priority statuses override lower ones

  // Ride completion/cancellation (highest priority)
  if (booking.status === 'completed' || booking.ride_status === 'completed') return 'completed';
  if (booking.status === 'cancelled' || booking.ride_status === 'cancelled_by_driver') return 'cancelled';
  if (booking.status === 'expired') return 'expired';

  // Active ride stages
  if (booking.ride_stage === 'completed') return 'completed';
  if (booking.ride_stage === 'in_transit') return 'in_transit';
  if (booking.ride_stage === 'passenger_onboard') return 'passenger_onboard';
  if (booking.ride_stage === 'driver_arrived_at_pickup') return 'driver_arrived_at_pickup';
  if (booking.ride_stage === 'driver_heading_to_pickup') return 'driver_heading_to_pickup';

  // Payment and confirmation flow
  if (booking.payment_confirmation_status === 'all_set') return 'all_set';
  if (booking.payment_confirmation_status === 'passenger_paid') return 'payment_confirmed';

  // Offer flow
  if (booking.status_passenger === 'offer_accepted' || booking.ride_status === 'offer_accepted') {
    return 'offer_accepted';
  }
  
  // Check if there's a price offer (driver sent offer)
  if (booking.final_price && booking.final_price !== booking.estimated_price) {
    return 'offer_sent';
  }
  
  if (booking.ride_status === 'offer_sent' || booking.status_driver === 'offer_sent') {
    return 'offer_sent';
  }

  // Driver acceptance
  if (booking.status_driver === 'driver_accepted' || booking.ride_status === 'accepted_by_driver') {
    return 'driver_accepted';
  }

  // Default to pending
  return 'pending';
};

/**
 * Get status message for UI display
 */
export const getStatusMessage = (status: UnifiedStatus, userType: 'passenger' | 'driver'): {
  primary: string;
  secondary: string;
  color: string;
} => {
  const messages = {
    passenger: {
      pending: { primary: 'Ride Requested', secondary: 'Waiting for driver response', color: 'text-orange-600' },
      driver_accepted: { primary: 'Driver Accepted', secondary: 'Driver is preparing your offer', color: 'text-blue-600' },
      offer_sent: { primary: 'Offer Received', secondary: 'Review and confirm your ride', color: 'text-purple-600' },
      offer_accepted: { primary: 'Offer Accepted', secondary: 'Please confirm your payment', color: 'text-blue-600' },
      payment_confirmed: { primary: 'Payment Sent', secondary: 'Waiting for driver confirmation', color: 'text-green-600' },
      all_set: { primary: '✅ All Set!', secondary: 'Your ride is confirmed and ready!', color: 'text-emerald-600' },
      driver_heading_to_pickup: { primary: 'Driver En Route', secondary: 'Driver is heading to pickup location', color: 'text-blue-600' },
      driver_arrived_at_pickup: { primary: 'Driver Arrived', secondary: 'Driver is waiting at pickup location', color: 'text-green-600' },
      passenger_onboard: { primary: 'Ride Started', secondary: 'Enjoy your ride!', color: 'text-blue-600' },
      in_transit: { primary: 'In Transit', secondary: 'On the way to destination', color: 'text-blue-600' },
      completed: { primary: 'Ride Completed', secondary: 'Thank you for choosing VIP Drive!', color: 'text-emerald-600' },
      cancelled: { primary: 'Ride Cancelled', secondary: 'You can request a new ride', color: 'text-gray-600' },
      expired: { primary: 'Offer Expired', secondary: 'Please request a new ride', color: 'text-gray-600' }
    },
    driver: {
      pending: { primary: 'New Ride Request', secondary: 'Please respond to the request', color: 'text-orange-600' },
      driver_accepted: { primary: 'Accepted', secondary: 'Send your price offer', color: 'text-blue-600' },
      offer_sent: { primary: 'Offer Sent', secondary: 'Waiting for passenger confirmation', color: 'text-purple-600' },
      offer_accepted: { primary: 'Offer Accepted', secondary: 'Waiting for payment', color: 'text-blue-600' },
      payment_confirmed: { primary: 'Payment Received', secondary: 'Confirm payment to complete', color: 'text-green-600' },
      all_set: { primary: '✅ Ready to Go!', secondary: 'Ride confirmed and ready', color: 'text-emerald-600' },
      driver_heading_to_pickup: { primary: 'Heading to Pickup', secondary: 'On the way to passenger', color: 'text-blue-600' },
      driver_arrived_at_pickup: { primary: 'Arrived at Pickup', secondary: 'Waiting for passenger', color: 'text-green-600' },
      passenger_onboard: { primary: 'Passenger Onboard', secondary: 'Ride in progress', color: 'text-blue-600' },
      in_transit: { primary: 'In Transit', secondary: 'Heading to destination', color: 'text-blue-600' },
      completed: { primary: 'Ride Completed', secondary: 'Well done!', color: 'text-emerald-600' },
      cancelled: { primary: 'Ride Cancelled', secondary: 'Ready for new requests', color: 'text-gray-600' },
      expired: { primary: 'Request Expired', secondary: 'Ready for new requests', color: 'text-gray-600' }
    }
  };

  return messages[userType][status] || { primary: 'Status Unknown', secondary: '', color: 'text-gray-600' };
};

/**
 * Determine which modal should be shown based on status
 */
export const getRequiredModal = (status: UnifiedStatus, userType: 'passenger' | 'driver'): string | null => {
  if (userType === 'passenger') {
    switch (status) {
      case 'offer_sent':
        return 'offer_acceptance';
      case 'offer_accepted':
        return 'payment_instructions';
      case 'all_set':
        return 'all_set_confirmation';
      default:
        return null;
    }
  } else {
    switch (status) {
      case 'pending':
        return 'driver_ride_request';
      case 'payment_confirmed':
        return 'driver_payment_confirmation';
      case 'all_set':
        return 'all_set_confirmation';
      default:
        return null;
    }
  }
};

/**
 * Check if a status allows reopening modals
 */
export const canReopenModal = (status: UnifiedStatus): boolean => {
  return ['offer_sent', 'payment_confirmed'].includes(status);
};
