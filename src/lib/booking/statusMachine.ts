
export type BookingStatus = 
  | 'pending' 
  | 'offer_sent' 
  | 'offer_accepted' 
  | 'awaiting_payment' 
  | 'paid' 
  | 'driver_assigned' 
  | 'en_route' 
  | 'passenger_onboard' 
  | 'completed' 
  | 'cancelled' 
  | 'refunded' 
  | 'disputed';

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['offer_sent', 'cancelled'],
  offer_sent: ['offer_accepted', 'cancelled'],
  offer_accepted: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['driver_assigned', 'refunded'],
  driver_assigned: ['en_route', 'cancelled'],
  en_route: ['passenger_onboard', 'cancelled'],
  passenger_onboard: ['completed'],
  completed: ['refunded', 'disputed'],
  cancelled: ['refunded'],
  refunded: [],
  disputed: []
};

export class BookingStatusManager {
  static isValidTransition(from: BookingStatus, to: BookingStatus): boolean {
    return BOOKING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static getValidNextStatuses(current: BookingStatus): BookingStatus[] {
    return BOOKING_STATUS_TRANSITIONS[current] || [];
  }

  static normalizeStatus(status: string): BookingStatus {
    // Normalize various status formats to our standard enum
    const normalizedMap: Record<string, BookingStatus> = {
      'booking_requested': 'pending',
      'driver_assigned': 'driver_assigned',
      'assigned': 'driver_assigned',
      'assigned_by_dispatcher': 'driver_assigned',
      'offer_sent': 'offer_sent',
      'payment_pending': 'awaiting_payment',
      'passenger_paid': 'paid',
      'all_set': 'driver_assigned',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };

    return normalizedMap[status] || (status as BookingStatus);
  }
}
