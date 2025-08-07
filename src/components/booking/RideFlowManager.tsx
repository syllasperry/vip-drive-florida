
import { useState, useEffect } from "react";
import { OfferAcceptanceModal } from "./OfferAcceptanceModal";
import { PaymentInstructionsAlert } from "./PaymentInstructionsAlert";
import { PassengerCancellationAlert } from "./PassengerCancellationAlert";
import { DriverPaymentConfirmationAlert } from "./DriverPaymentConfirmationAlert";
import { AllSetConfirmationAlert } from "./AllSetConfirmationAlert";
import { DriverRideRequestModal } from "../roadmap/DriverRideRequestModal";
import { PassengerOfferReviewModal } from "../roadmap/PassengerOfferReviewModal";
import { DriverPaymentConfirmationModal } from "../roadmap/DriverPaymentConfirmationModal";
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

  // Use offers hook for detecting driver offers - work with existing bookings too
  const { offers } = useDriverOffers({ 
    bookingId: booking?.id, 
    enabled: !!booking?.id 
  });

  useEffect(() => {
    if (forceOpenStep) {
      setCurrentStep(forceOpenStep);
      return;
    }

    if (!booking) return;

    console.log('🔄 RideFlowManager - Current booking data:', {
      ride_status: booking.ride_status,
      status_driver: booking.status_driver,
      status_passenger: booking.status_passenger,
      final_price: booking.final_price,
      payment_confirmation_status: booking.payment_confirmation_status,
      userType,
      hasOffers: offers.length > 0,
      bookingId: booking.id
    });

    const { status_passenger, status_driver, ride_status, payment_confirmation_status } = booking;

    if (userType === 'passenger') {
      // Check for driver offer - work with existing bookings
      const hasDriverSentOffer = (
        offers.some(offer => offer.status === 'offer_sent') ||
        ride_status === 'offer_sent' || 
        status_driver === 'offer_sent' ||
        payment_confirmation_status === 'price_awaiting_acceptance' ||
        // Also check if there's a final_price set by driver
        (booking.final_price && booking.final_price !== booking.estimated_price)
      );

      console.log('🔍 Passenger offer detection (existing bookings):', {
        hasDriverSentOffer,
        offers: offers.length,
        ride_status,
        status_driver,
        payment_confirmation_status,
        hasFinalPrice: !!booking.final_price,
        finalPrice: booking.final_price,
        estimatedPrice: booking.estimated_price
      });

      // Show offer modal for existing bookings with offers
      if (hasDriverSentOffer && status_passenger !== 'offer_accepted' && payment_confirmation_status !== 'passenger_paid') {
        setCurrentStep('offer_acceptance');
      } else if (status_passenger === 'offer_accepted' && payment_confirmation_status === 'waiting_for_payment') {
        setCurrentStep('payment_instructions');
      } else if (payment_confirmation_status === 'all_set') {
        setCurrentStep('all_set_confirmation');
      } else {
        setCurrentStep(null);
      }
    } else if (userType === 'driver') {
      // Driver logic - work with existing bookings
      if ((ride_status === 'pending_driver' || status_driver === 'new_request') && 
          payment_confirmation_status === 'waiting_for_offer') {
        setCurrentStep('driver_ride_request');
      } else if (payment_confirmation_status === 'passenger_paid') {
        setCurrentStep('driver_payment_confirmation');
      } else if (payment_confirmation_status === 'all_set') {
        setCurrentStep('all_set_confirmation');
      } else {
        setCurrentStep(null);
      }
    }
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
      console.log('🔄 Accepting offer for booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        status_passenger: 'offer_accepted',
        payment_confirmation_status: 'waiting_for_payment'
      });

      await createRideStatus({
        ride_id: booking.id,
        actor_role: 'passenger',
        status_code: 'offer_accepted',
        status_label: 'Passenger Accepted Offer'
      });

      console.log('✅ Offer accepted successfully');
      setCurrentStep('payment_instructions');
    } catch (error) {
      console.error('❌ Error accepting offer:', error);
      setCurrentStep('payment_instructions');
    }
  };

  const handleOfferDeclined = () => {
    setCurrentStep('passenger_cancellation');
  };

  const handlePaymentConfirmed = async () => {
    try {
      console.log('🔄 Confirming payment for booking:', booking.id);
      
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

      console.log('✅ Payment confirmed successfully');
      setCurrentStep(null);
      onFlowComplete();
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      setCurrentStep(null);
      onFlowComplete();
    }
  };

  const handleDriverPaymentConfirmed = async () => {
    try {
      console.log('🔄 Driver confirming payment for booking:', booking.id);
      
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

      console.log('✅ Driver payment confirmation successful');
      setCurrentStep('all_set_confirmation');
    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      setCurrentStep('all_set_confirmation');
    }
  };

  if (!currentStep || !booking) return null;

  return (
    <>
      {/* Driver Modals */}
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
          onFlowComplete();
        }}
      />

      {/* Passenger Modals */}
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
