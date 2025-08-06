// Comprehensive roadmap status management for passenger-driver interactions
import { supabase } from '@/integrations/supabase/client';

export interface RoadmapStep {
  id: string;
  label: string;
  description: string;
  actor: 'passenger' | 'driver' | 'system';
  status: 'pending' | 'current' | 'completed' | 'skipped';
  order: number;
  modalType?: string;
  timeout?: number; // in minutes
}

export interface RoadmapConfig {
  passengerSteps: RoadmapStep[];
  driverSteps: RoadmapStep[];
  currentStep: string;
  tabPlacement: 'new-requests' | 'upcoming' | 'new-rides' | 'past-rides';
}

// Status transitions mapping
export const ROADMAP_TRANSITIONS = {
  // Initial state
  'passenger_requested': {
    ride_status: 'pending_driver',
    payment_confirmation_status: 'waiting_for_offer',
    next_step: 'driver_receives_request'
  },
  
  // Driver receives and sends offer
  'offer_sent': {
    ride_status: 'offer_sent',
    payment_confirmation_status: 'waiting_for_offer',
    next_step: 'passenger_reviews_offer'
  },
  
  // Passenger accepts offer
  'offer_accepted': {
    ride_status: 'driver_accepted',
    payment_confirmation_status: 'waiting_for_payment',
    next_step: 'passenger_payment_instructions'
  },
  
  // Passenger confirms payment
  'payment_sent': {
    ride_status: 'payment_sent_awaiting_driver_confirmation',
    payment_confirmation_status: 'passenger_paid',
    next_step: 'driver_confirms_payment'
  },
  
  // Driver confirms payment
  'payment_confirmed': {
    ride_status: 'all_set',
    payment_confirmation_status: 'all_set',
    next_step: 'ride_ready'
  },
  
  // Cancellations
  'offer_declined': {
    ride_status: 'offer_declined',
    payment_confirmation_status: 'cancelled',
    next_step: 'ride_cancelled'
  },
  
  'driver_timeout': {
    ride_status: 'driver_not_available',
    payment_confirmation_status: 'cancelled',
    next_step: 'find_new_driver'
  }
};

export const getRoadmapConfig = (booking: any): RoadmapConfig => {
  const { ride_status, payment_confirmation_status, status_passenger, status_driver } = booking;
  
  // Passenger roadmap steps
  const passengerSteps: RoadmapStep[] = [
    {
      id: 'ride_requested',
      label: 'Ride Requested',
      description: 'Booking submitted successfully',
      actor: 'passenger',
      status: 'completed',
      order: 1
    },
    {
      id: 'offer_received',
      label: 'Offer Received',
      description: 'Driver sent price proposal',
      actor: 'driver',
      status: ride_status === 'offer_sent' ? 'current' : 
              (payment_confirmation_status !== 'waiting_for_offer' ? 'completed' : 'pending'),
      order: 2,
      modalType: 'offer_review'
    },
    {
      id: 'offer_accepted',
      label: 'Offer Accepted',
      description: 'You accepted the proposal',
      actor: 'passenger',
      status: status_passenger === 'offer_accepted' || payment_confirmation_status !== 'waiting_for_offer' ? 'completed' : 'pending',
      order: 3
    },
    {
      id: 'payment_sent',
      label: 'Payment Sent',
      description: 'Payment completed by you',
      actor: 'passenger',
      status: payment_confirmation_status === 'passenger_paid' || payment_confirmation_status === 'all_set' ? 'completed' : 
              (payment_confirmation_status === 'waiting_for_payment' ? 'current' : 'pending'),
      order: 4,
      modalType: 'payment_instructions'
    },
    {
      id: 'all_set',
      label: 'All Set',
      description: 'Driver confirmed payment - Ready to ride!',
      actor: 'driver',
      status: payment_confirmation_status === 'all_set' ? 'completed' : 'pending',
      order: 5
    }
  ];

  // Driver roadmap steps
  const driverSteps: RoadmapStep[] = [
    {
      id: 'new_ride_request',
      label: 'New Ride Request',
      description: 'Passenger requested your vehicle',
      actor: 'passenger',
      status: 'completed',
      order: 1,
      modalType: 'ride_request',
      timeout: 10 // 10 minutes timeout
    },
    {
      id: 'offer_sent',
      label: 'Offer Sent',
      description: 'Price proposal sent to passenger',
      actor: 'driver',
      status: ride_status === 'offer_sent' || status_driver === 'offer_sent' ? 'completed' : 'pending',
      order: 2
    },
    {
      id: 'accepted_ride',
      label: 'Accepted Ride',
      description: 'You accepted the booking',
      actor: 'driver',
      status: status_driver === 'driver_accepted' || ride_status === 'driver_accepted' ? 'completed' : 'pending',
      order: 3
    },
    {
      id: 'waiting_for_payment',
      label: 'Waiting for Payment',
      description: 'Passenger needs to complete payment',
      actor: 'passenger',
      status: payment_confirmation_status === 'waiting_for_payment' ? 'current' : 
              (payment_confirmation_status === 'passenger_paid' || payment_confirmation_status === 'all_set' ? 'completed' : 'pending'),
      order: 4
    },
    {
      id: 'all_set',
      label: 'All Set',
      description: 'Payment confirmed - Ready for pickup!',
      actor: 'driver',
      status: payment_confirmation_status === 'all_set' ? 'completed' : 
              (payment_confirmation_status === 'passenger_paid' ? 'current' : 'pending'),
      order: 5,
      modalType: 'payment_confirmation'
    }
  ];

  // Determine current step and tab placement
  let currentStep = 'ride_requested';
  let tabPlacement: 'new-requests' | 'upcoming' | 'new-rides' | 'past-rides' = 'new-requests';

  if (payment_confirmation_status === 'all_set') {
    currentStep = 'all_set';
    tabPlacement = 'new-rides';
  } else if (payment_confirmation_status === 'passenger_paid') {
    currentStep = 'driver_confirms_payment';
    tabPlacement = 'new-requests';
  } else if (payment_confirmation_status === 'waiting_for_payment') {
    currentStep = 'passenger_payment_instructions';
    tabPlacement = 'new-requests';
  } else if (ride_status === 'offer_sent') {
    currentStep = 'passenger_reviews_offer';
    tabPlacement = 'new-requests';
  }

  return {
    passengerSteps,
    driverSteps,
    currentStep,
    tabPlacement
  };
};

export const updateBookingWithTransition = async (
  bookingId: string,
  transitionKey: string,
  additionalUpdates: Record<string, any> = {}
) => {
  const transition = ROADMAP_TRANSITIONS[transitionKey as keyof typeof ROADMAP_TRANSITIONS];
  if (!transition) {
    throw new Error(`Unknown transition: ${transitionKey}`);
  }

  const updates = {
    ride_status: transition.ride_status,
    payment_confirmation_status: transition.payment_confirmation_status,
    updated_at: new Date().toISOString(),
    ...additionalUpdates
  };

  const { error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId);

  if (error) {
    console.error('Error updating booking with transition:', error);
    throw error;
  }

  // Create status history entry
  const { error: historyError } = await supabase
    .from('booking_status_history')
    .insert({
      booking_id: bookingId,
      status: transitionKey,
      metadata: {
        transition: transition,
        updates: updates
      }
    });

  if (historyError) {
    console.error('Error creating status history:', historyError);
  }

  console.log(`✅ Booking updated with transition: ${transitionKey}`);
  return transition.next_step;
};

export const shouldShowModal = (booking: any, userType: 'passenger' | 'driver', stepId: string): boolean => {
  const config = getRoadmapConfig(booking);
  const steps = userType === 'passenger' ? config.passengerSteps : config.driverSteps;
  const step = steps.find(s => s.id === stepId);
  
  return step?.status === 'current' && step?.modalType !== undefined;
};

export const getModalType = (booking: any, userType: 'passenger' | 'driver', stepId: string): string | null => {
  const config = getRoadmapConfig(booking);
  const steps = userType === 'passenger' ? config.passengerSteps : config.driverSteps;
  const step = steps.find(s => s.id === stepId);
  
  return step?.modalType || null;
};

export const shouldHideDriverButtons = (booking: any): boolean => {
  // Hide buttons after driver has sent offer AND accepted the ride
  return booking.status_driver === 'driver_accepted' || 
         booking.ride_status === 'driver_accepted' ||
         booking.payment_confirmation_status !== 'waiting_for_offer';
};