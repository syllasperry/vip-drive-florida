import { useState, useEffect } from "react";
import { OfferAcceptanceModal } from "./OfferAcceptanceModal";
import { PaymentInstructionsAlert } from "./PaymentInstructionsAlert";
import { PassengerCancellationAlert } from "./PassengerCancellationAlert";
import { DriverPaymentConfirmationAlert } from "./DriverPaymentConfirmationAlert";
import { AllSetConfirmationAlert } from "./AllSetConfirmationAlert";
import { getStatusConfig } from "@/utils/statusManager";
import { supabase } from "@/integrations/supabase/client";

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

        // Use validated booking data for status decisions
        const { status_passenger, status_driver, ride_status, payment_confirmation_status } = validBooking;

        if (userType === 'passenger') {
          if (ride_status === 'offer_sent') {
            setCurrentStep('offer_acceptance');
          } else if (status_passenger === 'offer_accepted' && payment_confirmation_status !== 'passenger_paid' && payment_confirmation_status !== 'all_set') {
            setCurrentStep('payment_instructions');
          } else if (status_passenger === 'passenger_canceled') {
            setCurrentStep('passenger_cancellation');
          } else if (payment_confirmation_status === 'all_set') {
            setCurrentStep('all_set_confirmation');
          } else {
            setCurrentStep(null);
          }
        } else if (userType === 'driver') {
          if (payment_confirmation_status === 'passenger_paid') {
            setCurrentStep('driver_payment_confirmation');
          } else if (payment_confirmation_status === 'all_set') {
            setCurrentStep('all_set_confirmation');
          } else {
            setCurrentStep(null);
          }
        }
      } catch (error) {
        console.error('Error validating booking:', error);
        setCurrentStep(null);
      }
    };

    validateAndSetStep();
  }, [booking, userType, forceOpenStep]);

  const handleClose = () => {
    setCurrentStep(null);
  };

  const handleStepComplete = () => {
    setCurrentStep(null);
    onFlowComplete();
  };

  const handleOfferAccepted = () => {
    setCurrentStep('payment_instructions');
  };

  const handleOfferDeclined = () => {
    setCurrentStep('passenger_cancellation');
  };

  const handlePaymentConfirmed = () => {
    setCurrentStep(null);
    onFlowComplete();
  };

  const handleDriverPaymentConfirmed = () => {
    setCurrentStep('all_set_confirmation');
  };

  if (!currentStep || !booking) return null;

  return (
    <>
      <OfferAcceptanceModal
        isOpen={currentStep === 'offer_acceptance'}
        onClose={handleClose}
        booking={booking}
        onAccept={handleOfferAccepted}
        onDecline={handleOfferDeclined}
      />

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

      <DriverPaymentConfirmationAlert
        isOpen={currentStep === 'driver_payment_confirmation'}
        onClose={handleClose}
        booking={booking}
        onPaymentConfirmed={handleDriverPaymentConfirmed}
        onMessagePassenger={onMessagePassenger || (() => {})}
      />

      <AllSetConfirmationAlert
        isOpen={currentStep === 'all_set_confirmation'}
        onClose={handleClose}
        booking={booking}
      />
    </>
  );
};