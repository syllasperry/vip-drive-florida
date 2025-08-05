import { useState, useEffect } from "react";
import { OfferAcceptanceModal } from "./OfferAcceptanceModal";
import { PaymentInstructionsAlert } from "./PaymentInstructionsAlert";
import { PassengerCancellationAlert } from "./PassengerCancellationAlert";
import { DriverPaymentConfirmationAlert } from "./DriverPaymentConfirmationAlert";
import { AllSetConfirmationAlert } from "./AllSetConfirmationAlert";

interface RideFlowManagerProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onFlowComplete: () => void;
  onMessagePassenger?: () => void;
}

export const RideFlowManager = ({ 
  booking, 
  userType, 
  onFlowComplete,
  onMessagePassenger 
}: RideFlowManagerProps) => {
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    if (!booking) return;

    // Determine which alert to show based on booking status and user type
    const { ride_status, payment_confirmation_status } = booking;

    if (userType === 'passenger') {
      if (ride_status === 'offer_sent' && payment_confirmation_status === 'price_awaiting_acceptance') {
        setCurrentStep('offer_acceptance');
      } else if (ride_status === 'passenger_approved' && payment_confirmation_status === 'waiting_for_payment') {
        setCurrentStep('payment_instructions');
      } else if (ride_status === 'offer_declined') {
        setCurrentStep('passenger_cancellation');
      } else if (ride_status === 'all_set' && payment_confirmation_status === 'all_set') {
        setCurrentStep('all_set_confirmation');
      } else {
        setCurrentStep(null);
      }
    } else if (userType === 'driver') {
      if (ride_status === 'awaiting_driver_confirmation' && payment_confirmation_status === 'passenger_paid') {
        setCurrentStep('driver_payment_confirmation');
      } else if (ride_status === 'all_set' && payment_confirmation_status === 'all_set') {
        setCurrentStep('all_set_confirmation');
      } else {
        setCurrentStep(null);
      }
    }
  }, [booking, userType]);

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
        onClose={handleStepComplete}
        booking={booking}
        onAccept={handleOfferAccepted}
        onDecline={handleOfferDeclined}
      />

      <PaymentInstructionsAlert
        isOpen={currentStep === 'payment_instructions'}
        onClose={handleStepComplete}
        booking={booking}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <PassengerCancellationAlert
        isOpen={currentStep === 'passenger_cancellation'}
        onClose={handleStepComplete}
      />

      <DriverPaymentConfirmationAlert
        isOpen={currentStep === 'driver_payment_confirmation'}
        onClose={handleStepComplete}
        booking={booking}
        onPaymentConfirmed={handleDriverPaymentConfirmed}
        onMessagePassenger={onMessagePassenger || (() => {})}
      />

      <AllSetConfirmationAlert
        isOpen={currentStep === 'all_set_confirmation'}
        onClose={handleStepComplete}
        booking={booking}
      />
    </>
  );
};