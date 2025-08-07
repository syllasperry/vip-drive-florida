

import { useState, useEffect } from "react";
import { OfferAcceptanceModal } from "./OfferAcceptanceModal";
import { PaymentInstructionsAlert } from "./PaymentInstructionsAlert";
import { PassengerCancellationAlert } from "./PassengerCancellationAlert";
import { DriverPaymentConfirmationAlert } from "./DriverPaymentConfirmationAlert";
import { AllSetConfirmationAlert } from "./AllSetConfirmationAlert";
import { DriverRideRequestModal } from "../roadmap/DriverRideRequestModal";
import { PassengerOfferReviewModal } from "../roadmap/PassengerOfferReviewModal";
import { DriverPaymentConfirmationModal } from "../roadmap/DriverPaymentConfirmationModal";
import { getRoadmapConfig, shouldShowModal, getModalType } from "@/utils/roadmapStatusManager";
import { supabase } from "@/integrations/supabase/client";
import { useDriverOffers } from "@/hooks/useDriverOffers";
import { updateBookingStatus, createRideStatus } from "@/utils/supabaseHelpers";

interface RideFlowManagerProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onFlowComplete: () => void;
  onMessagePassenger?: () => void;
  forceOpenStep?: string | null;
}

export const RideFlowManager = ({ 
  booking, 
  userType, 
  onFlowComplete,
  onMessagePassenger,
  forceOpenStep 
}: RideFlowManagerProps) => {
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  // Use o hook de offers para detectar ofertas do driver
  const { offers } = useDriverOffers({ 
    bookingId: booking?.id, 
    enabled: !!booking?.id 
  });

  useEffect(() => {
    // If forceOpenStep is provided, use it
    if (forceOpenStep) {
      setCurrentStep(forceOpenStep);
      return;
    }

    if (!booking) return;

    // Validate booking exists in database first
    const validateAndSetStep = async () => {
      try {
        const { data: validBooking, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', booking.id)
          .single();

        if (error || !validBooking) {
          console.log('Booking not found in database, closing flow');
          setCurrentStep(null);
          return;
        }

        console.log('🔄 RideFlowManager - Current booking data:', {
          ride_status: validBooking.ride_status,
          status_driver: validBooking.status_driver,
          status_passenger: validBooking.status_passenger,
          final_price: validBooking.final_price,
          estimated_price: validBooking.estimated_price,
          payment_confirmation_status: validBooking.payment_confirmation_status,
          userType,
          hasOffers: offers.length > 0
        });

        // Use roadmap system to determine which modal to show
        const config = getRoadmapConfig(validBooking);
        const steps = userType === 'passenger' ? config.passengerSteps : config.driverSteps;
        
        // Find current step that needs modal interaction
        const currentModalStep = steps.find(step => 
          step.status === 'current' && step.modalType
        );

        if (currentModalStep) {
          // Map roadmap modal types to existing step names
          const modalTypeMapping: Record<string, string> = {
            'ride_request': 'driver_ride_request',
            'offer_review': 'offer_acceptance', 
            'payment_instructions': 'payment_instructions',
            'payment_confirmation': 'driver_payment_confirmation'
          };
          
          setCurrentStep(modalTypeMapping[currentModalStep.modalType] || null);
        } else {
          // Enhanced logic integrating with Supabase functions and triggers
          const { status_passenger, status_driver, ride_status, payment_confirmation_status } = validBooking;

          if (userType === 'passenger') {
            // Enhanced offer detection using offers table + booking status
            const hasDriverOffer = (
              offers.some(offer => offer.status === 'offer_sent') ||
              ride_status === 'offer_sent' || 
              status_driver === 'offer_sent' ||
              status_driver === 'driver_accepted' ||
              (ride_status === 'driver_accepted' && (validBooking.final_price || validBooking.estimated_price)) ||
              payment_confirmation_status === 'price_awaiting_acceptance'
            );

            console.log('🔄 Passenger offer detection (enhanced):', {
              hasDriverOffer,
              conditions: {
                offers_table: offers.some(offer => offer.status === 'offer_sent'),
                ride_status_offer_sent: ride_status === 'offer_sent',
                status_driver_offer_sent: status_driver === 'offer_sent', 
                status_driver_accepted: status_driver === 'driver_accepted',
                driver_accepted_with_price: ride_status === 'driver_accepted' && (validBooking.final_price || validBooking.estimated_price),
                price_awaiting_acceptance: payment_confirmation_status === 'price_awaiting_acceptance'
              }
            });

            if (hasDriverOffer && status_passenger !== 'offer_accepted' && payment_confirmation_status !== 'passenger_paid' && payment_confirmation_status !== 'all_set') {
              setCurrentStep('offer_acceptance');
            } else if (status_passenger === 'offer_accepted' && payment_confirmation_status === 'waiting_for_payment') {
              setCurrentStep('payment_instructions');
            } else if (payment_confirmation_status === 'all_set') {
              setCurrentStep('all_set_confirmation');
            } else {
              setCurrentStep(null);
            }
          } else if (userType === 'driver') {
            // Driver logic with automatic assignment from triggers
            if ((ride_status === 'pending_driver' || status_driver === 'new_request') && !status_driver) {
              setCurrentStep('driver_ride_request');
            } else if (payment_confirmation_status === 'passenger_paid') {
              setCurrentStep('driver_payment_confirmation');
            } else if (payment_confirmation_status === 'all_set') {
              setCurrentStep('all_set_confirmation');
            } else {
              setCurrentStep(null);
            }
          }
        }
      } catch (error) {
        console.error('Error validating booking:', error);
        setCurrentStep(null);
      }
    };

    validateAndSetStep();
  }, [booking, userType, forceOpenStep, offers]);

  const handleClose = () => {
    setCurrentStep(null);
  };

  const handleStepComplete = () => {
    setCurrentStep(null);
    onFlowComplete();
  };

  const handleOfferAccepted = async () => {
    try {
      // Use Supabase helper to update with proper triggers
      await updateBookingStatus(booking.id, {
        status_passenger: 'offer_accepted',
        payment_confirmation_status: 'waiting_for_payment'
      });

      // Create ride status entry
      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'passenger',
        status_code: 'offer_accepted',
        status_label: 'Passenger Accepted Offer'
      });

      setCurrentStep('payment_instructions');
    } catch (error) {
      console.error('Error accepting offer:', error);
      setCurrentStep('payment_instructions');
    }
  };

  const handleOfferDeclined = () => {
    setCurrentStep('passenger_cancellation');
  };

  const handlePaymentConfirmed = async () => {
    try {
      // Use Supabase helper with automatic timestamp triggers
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'passenger_paid',
        passenger_payment_confirmed_at: new Date().toISOString()
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'passenger',
        status_code: 'payment_sent',
        status_label: 'Payment Confirmed by Passenger'
      });

      setCurrentStep(null);
      onFlowComplete();
    } catch (error) {
      console.error('Error confirming payment:', error);
      setCurrentStep(null);
      onFlowComplete();
    }
  };

  const handleDriverPaymentConfirmed = async () => {
    try {
      // Triggers will automatically sync status fields
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'all_set',
        driver_payment_confirmed_at: new Date().toISOString()
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'driver',
        status_code: 'payment_confirmed',
        status_label: 'Payment Confirmed by Driver'
      });

      setCurrentStep('all_set_confirmation');
    } catch (error) {
      console.error('Error confirming payment:', error);
      setCurrentStep('all_set_confirmation');
    }
  };

  if (!currentStep || !booking) return null;

  return (
    <>
      {/* Roadmap Modals */}
      <DriverRideRequestModal
        isOpen={currentStep === 'driver_ride_request'}
        onClose={handleClose}
        booking={booking}
        onAccept={() => {
          handleClose();
          onFlowComplete();
        }}
        onDecline={() => {
          handleClose();
          onFlowComplete();
        }}
        onSendOffer={() => {
          handleClose();
          // Handle send offer logic - will be processed by triggers
        }}
      />

      <PassengerOfferReviewModal
        isOpen={currentStep === 'offer_acceptance'}
        onClose={handleClose}
        booking={booking}
        onAccept={handleOfferAccepted}
        onDecline={handleOfferDeclined}
      />

      <DriverPaymentConfirmationModal
        isOpen={currentStep === 'driver_payment_confirmation'}
        onClose={handleClose}
        booking={booking}
        onPaymentConfirmed={handleDriverPaymentConfirmed}
        onMessagePassenger={onMessagePassenger}
      />

      {/* Legacy Modals */}
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

