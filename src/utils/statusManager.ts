// Status Manager for synchronized passenger and driver statuses
export interface StatusConfig {
  passenger: string;
  driver: string;
  description: string;
  allowOpenOffer: boolean;
  tabPlacement: 'new-requests' | 'upcoming' | 'new-rides' | 'past-rides';
}

export const STATUS_FLOW: Record<string, StatusConfig> = {
  // Initial request
  PASSENGER_REQUESTED: {
    passenger: 'passenger_requested',
    driver: 'new_request',
    description: 'Passenger made ride request',
    allowOpenOffer: true,
    tabPlacement: 'new-requests'
  },
  
  // Driver sends offer
  OFFER_SENT: {
    passenger: 'offer_sent',
    driver: 'offer_sent',
    description: 'Driver sent fixed price proposal',
    allowOpenOffer: false,
    tabPlacement: 'new-requests'
  },
  
  // Passenger accepts offer
  PASSENGER_ACCEPTED: {
    passenger: 'passenger_accepted',
    driver: 'passenger_accepted',
    description: 'Passenger accepted the proposed price',
    allowOpenOffer: false,
    tabPlacement: 'new-requests'
  },
  
  // Passenger confirms payment
  PAYMENT_CONFIRMED: {
    passenger: 'payment_confirmed',
    driver: 'payment_confirmed',
    description: 'Passenger confirmed payment made',
    allowOpenOffer: false,
    tabPlacement: 'new-requests'
  },
  
  // Driver accepts payment
  DRIVER_ACCEPTED: {
    passenger: 'driver_accepted',
    driver: 'driver_accepted',
    description: 'Driver confirmed payment received',
    allowOpenOffer: false,
    tabPlacement: 'new-requests'
  },
  
  // All set - ready for ride
  ALL_SET: {
    passenger: 'all_set',
    driver: 'all_set',
    description: 'Everything confirmed, ride ready',
    allowOpenOffer: false,
    tabPlacement: 'new-rides'
  },
  
  // Optional ride stages
  DRIVER_HEADING: {
    passenger: 'driver_heading_to_pickup',
    driver: 'driver_heading_to_pickup',
    description: 'Driver heading to pickup',
    allowOpenOffer: false,
    tabPlacement: 'upcoming'
  },
  
  PASSENGER_ONBOARD: {
    passenger: 'passenger_onboard',
    driver: 'passenger_onboard',
    description: 'Passenger in vehicle',
    allowOpenOffer: false,
    tabPlacement: 'upcoming'
  },
  
  RIDE_IN_PROGRESS: {
    passenger: 'ride_in_progress',
    driver: 'ride_in_progress',
    description: 'Ride in progress',
    allowOpenOffer: false,
    tabPlacement: 'upcoming'
  },
  
  // Completed
  RIDE_COMPLETED: {
    passenger: 'ride_completed',
    driver: 'ride_completed',
    description: 'Ride completed successfully',
    allowOpenOffer: false,
    tabPlacement: 'past-rides'
  },
  
  // Cancellations
  PASSENGER_CANCELED: {
    passenger: 'passenger_canceled',
    driver: 'passenger_canceled',
    description: 'Canceled by passenger',
    allowOpenOffer: false,
    tabPlacement: 'past-rides'
  },
  
  DRIVER_CANCELED: {
    passenger: 'driver_canceled',
    driver: 'driver_canceled',
    description: 'Canceled by driver',
    allowOpenOffer: false,
    tabPlacement: 'past-rides'
  }
};

// Helper functions
export const getStatusConfig = (passengerStatus: string, driverStatus: string): StatusConfig | null => {
  return Object.values(STATUS_FLOW).find(
    config => config.passenger === passengerStatus && config.driver === driverStatus
  ) || null;
};

export const shouldShowOpenOfferButton = (booking: any): boolean => {
  const config = getStatusConfig(booking.status_passenger, booking.status_driver);
  return config?.allowOpenOffer || false;
};

export const getTabPlacement = (booking: any): 'new-requests' | 'upcoming' | 'new-rides' | 'past-rides' => {
  const config = getStatusConfig(booking.status_passenger, booking.status_driver);
  return config?.tabPlacement || 'new-requests';
};

export const updateBookingStatus = async (
  bookingId: string,
  statusType: 'passenger' | 'driver',
  newStatus: string
) => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const updateField = statusType === 'passenger' ? 'status_passenger' : 'status_driver';
  
  const { error } = await supabase
    .from('bookings')
    .update({ [updateField]: newStatus })
    .eq('id', bookingId);
    
  if (error) {
    console.error(`Error updating ${statusType} status:`, error);
    throw error;
  }
  
  console.log(`✅ ${statusType} status updated to:`, newStatus);
};