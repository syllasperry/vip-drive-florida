
/**
 * Helper functions for normalizing and validating booking status values
 */

/**
 * Valid booking status enum values based on the database schema
 */
export const VALID_BOOKING_STATUSES = [
  'pending',
  'offer_sent',
  'payment_pending',
  'all_set',
  'completed',
  'cancelled'
] as const;

export type ValidBookingStatus = typeof VALID_BOOKING_STATUSES[number];

/**
 * Normalize status values to valid booking_status enum values
 */
export const normalizeBookingStatus = (status: string | null | undefined): ValidBookingStatus => {
  if (!status) return 'pending';
  
  // Map common status values to valid enum values
  const statusMap: Record<string, ValidBookingStatus> = {
    'booking_requested': 'pending',
    'driver_assigned': 'pending',
    'assigned': 'pending',
    'assigned_by_dispatcher': 'pending',
    'offer_sent': 'offer_sent',
    'price_awaiting_acceptance': 'offer_sent',
    'payment_pending': 'payment_pending',
    'passenger_paid': 'payment_pending',
    'all_set': 'all_set',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'cancelled_by_driver': 'cancelled',
    'cancelled_by_passenger': 'cancelled'
  };
  
  const normalizedStatus = statusMap[status] || status;
  
  // Validate that the normalized status is in the valid enum values
  if (VALID_BOOKING_STATUSES.includes(normalizedStatus as ValidBookingStatus)) {
    return normalizedStatus as ValidBookingStatus;
  }
  
  // Default fallback
  console.warn(`Invalid booking status: ${status}, defaulting to 'pending'`);
  return 'pending';
};

/**
 * Validate if a status string is a valid booking_status enum value
 */
export const isValidBookingStatus = (status: string): status is ValidBookingStatus => {
  return VALID_BOOKING_STATUSES.includes(status as ValidBookingStatus);
};
