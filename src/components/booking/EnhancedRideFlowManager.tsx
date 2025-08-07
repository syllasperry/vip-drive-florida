
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBookingTimeline } from "@/hooks/useBookingTimeline";
import { useDriverOffers } from "@/hooks/useDriverOffers";
import { createRideStatus, updateBookingStatus, createNotification } from "@/utils/supabaseHelpers";
import { useToast } from "@/hooks/use-toast";

// Components
import { OfferAcceptanceModal } from "./OfferAcceptanceModal";
import { PaymentInstructionsAlert } from "./PaymentInstructionsAlert";
import { PassengerCancellationAlert } from "./PassengerCancellationAlert";
import { DriverPaymentConfirmationAlert } from "./DriverPaymentConfirmationAlert";
import { AllSetConfirmationAlert } from "./AllSetConfirmationAlert";
import { DriverRideRequestModal } from "../roadmap/DriverRideRequestModal";
import { PassengerOfferReviewModal } from "../roadmap/PassengerOfferReviewModal";
import { DriverPaymentConfirmationModal } from "../roadmap/DriverPaymentConfirmationModal";

interface EnhancedRideFlowManagerProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onFlowComplete: () => void;
  onMessagePassenger?: () => void;
  forceOpenStep?: string | null;
}

export const EnhancedRideFlowManager = ({ 
  booking, 
  userType, 
  onFlowComplete,
  onMessagePassenger,
  forceOpenStep 
}: EnhancedRideFlowManagerProps) => {
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use os hooks implementados para timeline e offers
  const { timelineEvents } = useBookingTimeline({ 
    bookingId: booking?.id, 
    enabled: !!booking?.id 
  });
  
  const { offers, createOffer } = useDriverOffers({ 
    bookingId: booking?.id, 
    enabled: !!booking?.id 
  });

  useEffect(() => {
    if (forceOpenStep) {
      setCurrentStep(forceOpenStep);
      return;
    }

    if (!booking) return;

    // Lógica aprimorada usando os dados do Supabase
    const determineCurrentStep = async () => {
      try {
        const { ride_status, payment_confirmation_status, status_passenger, status_driver } = booking;

        console.log('🔄 Enhanced RideFlowManager - Booking data:', {
          ride_status,
          payment_confirmation_status,
          status_passenger,
          status_driver,
          userType,
          hasOffers: offers.length > 0
        });

        if (userType === 'passenger') {
          // Detecta se driver enviou oferta
          const hasDriverOffer = offers.some(offer => offer.status === 'offer_sent') ||
                               ride_status === 'offer_sent' ||
                               status_driver === 'offer_sent' ||
                               (status_driver === 'driver_accepted' && booking.final_price) ||
                               payment_confirmation_status === 'price_awaiting_acceptance';

          if (hasDriverOffer && status_passenger !== 'offer_accepted' && payment_confirmation_status !== 'passenger_paid') {
            setCurrentStep('offer_acceptance');
          } else if (status_passenger === 'offer_accepted' && payment_confirmation_status === 'waiting_for_payment') {
            setCurrentStep('payment_instructions');
          } else if (payment_confirmation_status === 'all_set') {
            setCurrentStep('all_set_confirmation');
          } else {
            setCurrentStep(null);
          }
        } else if (userType === 'driver') {
          if (ride_status === 'pending_driver' || status_driver === 'new_request') {
            setCurrentStep('driver_ride_request');
          } else if (payment_confirmation_status === 'passenger_paid') {
            setCurrentStep('driver_payment_confirmation');
          } else if (payment_confirmation_status === 'all_set') {
            setCurrentStep('all_set_confirmation');
          } else {
            setCurrentStep(null);
          }
        }
      } catch (error) {
        console.error('Error determining current step:', error);
        setCurrentStep(null);
      }
    };

    determineCurrentStep();
  }, [booking, userType, forceOpenStep, offers]);

  const handleDriverAcceptRide = async () => {
    try {
      await updateBookingStatus(booking.id, {
        status_driver: 'driver_accepted',
        ride_status: 'driver_accepted'
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'driver',
        status_code: 'driver_accepted',
        status_label: 'Driver Accepted Ride',
        metadata: { accepted_at: new Date().toISOString() }
      });

      toast({
        title: "Ride Accepted!",
        description: "You have accepted this ride request.",
      });

      setCurrentStep(null);
      onFlowComplete();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Fixed function signature to match the expected callback
  const handleSendOfferWrapper = () => {
    // This will be called from the modal with a default price or prompt for price
    const defaultPrice = booking.estimated_price || 100;
    handleSendOffer(defaultPrice);
  };

  const handleSendOffer = async (price: number) => {
    try {
      // Cria a oferta usando o hook
      await createOffer({
        booking_id: booking.id,
        driver_id: booking.driver_id,
        vehicle_id: booking.vehicle_id || '',
        price_cents: Math.round(price * 100),
        offer_price: price
      });

      setCurrentStep(null);
      onFlowComplete();
    } catch (error) {
      console.error('Error sending offer:', error);
    }
  };

  const handleOfferAccepted = async () => {
    try {
      await updateBookingStatus(booking.id, {
        status_passenger: 'offer_accepted',
        ride_status: 'offer_accepted',
        payment_confirmation_status: 'waiting_for_payment'
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'passenger',
        status_code: 'offer_accepted',
        status_label: 'Passenger Accepted Offer',
        metadata: { accepted_at: new Date().toISOString() }
      });

      setCurrentStep('payment_instructions');
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handlePaymentConfirmed = async () => {
    try {
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'passenger_paid',
        passenger_payment_confirmed_at: new Date().toISOString()
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'passenger',
        status_code: 'payment_sent',
        status_label: 'Payment Confirmed by Passenger',
        metadata: { confirmed_at: new Date().toISOString() }
      });

      setCurrentStep(null);
      onFlowComplete();
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handleDriverPaymentConfirmed = async () => {
    try {
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'all_set',
        driver_payment_confirmed_at: new Date().toISOString()
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'driver',
        status_code: 'payment_confirmed',
        status_label: 'Payment Confirmed by Driver',
        metadata: { confirmed_at: new Date().toISOString() }
      });

      setCurrentStep('all_set_confirmation');
    } catch (error) {
      console.error('Error confirming payment:', error);
    }
  };

  const handleClose = () => {
    setCurrentStep(null);
  };

  if (!currentStep || !booking) return null;

  return (
    <>
      {/* Driver Modals */}
      <DriverRideRequestModal
        isOpen={currentStep === 'driver_ride_request'}
        onClose={handleClose}
        booking={booking}
        onAccept={handleDriverAcceptRide}
        onDecline={() => {
          handleClose();
          onFlowComplete();
        }}
        onSendOffer={handleSendOfferWrapper}
      />

      {/* Passenger Modals */}
      <PassengerOfferReviewModal
        isOpen={currentStep === 'offer_acceptance'}
        onClose={handleClose}
        booking={booking}
        onAccept={handleOfferAccepted}
        onDecline={() => {
          setCurrentStep('passenger_cancellation');
        }}
      />

      <DriverPaymentConfirmationModal
        isOpen={currentStep === 'driver_payment_confirmation'}
        onClose={handleClose}
        booking={booking}
        onPaymentConfirmed={handleDriverPaymentConfirmed}
        onMessagePassenger={onMessagePassenger}
      />

      {/* Shared Modals */}
      <PaymentInstructionsAlert
        isOpen={currentStep === 'payment_instructions'}
        onClose={handleClose}
        booking={booking}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <PassengerCancellationAlert
        isOpen={currentStep === 'passenger_cancellation'}
        onClose={handleClose}
      />

      <AllSetConfirmationAlert
        isOpen={currentStep === 'all_set_confirmation'}
        onClose={handleClose}
        booking={booking}
      />
    </>
  );
};
