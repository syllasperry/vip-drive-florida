
import { useState, useEffect } from "react";
import { OfferAcceptanceModal } from "./OfferAcceptanceModal";
import { PaymentInstructionsAlert } from "./PaymentInstructionsAlert";
import { PassengerCancellationAlert } from "./PassengerCancellationAlert";
import { DriverPaymentConfirmationAlert } from "./DriverPaymentConfirmationAlert";
import { AllSetConfirmationAlert } from "./AllSetConfirmationAlert";
import { DriverRideRequestModal } from "../roadmap/DriverRideRequestModal";
import { PassengerOfferReviewModal } from "../roadmap/PassengerOfferReviewModal";
import { DriverPaymentConfirmationModal } from "../roadmap/DriverPaymentConfirmationModal";
import { useBookingStore } from "@/stores/bookingStore";
import { getUnifiedStatus, getRequiredModal } from "@/utils/unifiedStatusManager";
import { updateBookingStatus } from "@/utils/supabaseHelpers";

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
  const { subscribeToBooking } = useBookingStore();

  useEffect(() => {
    if (!booking?.id) return;

    // Subscribe to real-time booking updates
    subscribeToBooking(booking.id);
  }, [booking?.id]);

  useEffect(() => {
    if (forceOpenStep) {
      console.log('🎯 Force opening step:', forceOpenStep);
      setCurrentStep(forceOpenStep);
      return;
    }

    if (!booking) return;

    // Use unified status system
    const unifiedStatus = getUnifiedStatus(booking);
    const requiredModal = getRequiredModal(unifiedStatus, userType);
    
    console.log('🔄 RideFlowManager - Unified status:', unifiedStatus, 'Required modal:', requiredModal, 'UserType:', userType);

    setCurrentStep(requiredModal);
  }, [booking, userType, forceOpenStep]);

  const handleOfferAccepted = async () => {
    try {
      console.log('✅ Accepting offer for booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        status_passenger: 'offer_accepted',
        payment_confirmation_status: 'waiting_for_payment'
      });

      console.log('✅ Offer accepted successfully');
      setCurrentStep('payment_instructions');
      onFlowComplete();
    } catch (error) {
      console.error('❌ Error accepting offer:', error);
    }
  };

  const handlePaymentConfirmed = async () => {
    try {
      console.log('💳 Confirming payment for booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'passenger_paid',
        passenger_payment_confirmed_at: new Date().toISOString()
      });

      console.log('✅ Payment confirmed successfully');
      setCurrentStep(null);
      onFlowComplete();
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
    }
  };

  const handleDriverPaymentConfirmed = async () => {
    try {
      console.log('💰 Driver confirming payment for booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'all_set',
        driver_payment_confirmed_at: new Date().toISOString()
      });

      console.log('✅ Driver confirmed payment');
      setCurrentStep('all_set_confirmation');
      onFlowComplete();
    } catch (error) {
      console.error('❌ Error in driver payment confirmation:', error);
    }
  };

  if (!currentStep || !booking) return null;

  return (
    <>
      <PassengerOfferReviewModal
        isOpen={currentStep === 'offer_acceptance'}
        onClose={() => setCurrentStep(null)}
        booking={booking}
        onAccept={handleOfferAccepted}
        onDecline={() => setCurrentStep('passenger_cancellation')}
      />

      <PaymentInstructionsAlert
        isOpen={currentStep === 'payment_instructions'}
        onClose={() => setCurrentStep(null)}
        booking={booking}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <DriverPaymentConfirmationModal
        isOpen={currentStep === 'driver_payment_confirmation'}
        onClose={() => setCurrentStep(null)}
        booking={booking}
        onPaymentConfirmed={handleDriverPaymentConfirmed}
        onMessagePassenger={onMessagePassenger}
      />

      <PassengerCancellationAlert
        isOpen={currentStep === 'passenger_cancellation'}
        onClose={() => setCurrentStep(null)}
      />

      <AllSetConfirmationAlert
        isOpen={currentStep === 'all_set_confirmation'}
        onClose={() => setCurrentStep(null)}
        booking={booking}
      />
    </>
  );
};
