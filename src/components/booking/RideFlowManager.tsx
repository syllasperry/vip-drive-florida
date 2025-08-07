
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
  const { getBookingStatus, subscribeToBooking, hasActiveOffer } = useBookingStore();

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

    const unifiedStatus = getBookingStatus(booking.id);
    console.log('🔄 RideFlowManager - Unified status:', unifiedStatus, 'UserType:', userType);

    if (userType === 'passenger') {
      switch (unifiedStatus) {
        case 'offer_sent':
          console.log('💰 Showing offer acceptance modal');
          setCurrentStep('offer_acceptance');
          break;
        case 'offer_accepted':
          if (booking.payment_confirmation_status === 'waiting_for_payment') {
            console.log('💳 Showing payment instructions');
            setCurrentStep('payment_instructions');
          }
          break;
        case 'all_set':
          console.log('✅ Showing all set confirmation');
          setCurrentStep('all_set_confirmation');
          break;
        default:
          setCurrentStep(null);
      }
    } else if (userType === 'driver') {
      switch (unifiedStatus) {
        case 'pending':
          if (booking.status_driver === 'new_request') {
            console.log('🚗 New ride request for driver');
            setCurrentStep('driver_ride_request');
          }
          break;
        case 'payment_confirmed':
          console.log('💰 Driver - Passenger paid, show confirmation');
          setCurrentStep('driver_payment_confirmation');
          break;
        case 'all_set':
          console.log('✅ Driver - All set confirmation');
          setCurrentStep('all_set_confirmation');
          break;
        default:
          setCurrentStep(null);
      }
    }
  }, [booking, userType, forceOpenStep, getBookingStatus]);

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
