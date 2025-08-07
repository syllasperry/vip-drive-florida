
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

  useEffect(() => {
    if (forceOpenStep) {
      console.log('🎯 Forçando abertura do step:', forceOpenStep);
      setCurrentStep(forceOpenStep);
      return;
    }

    if (!booking) return;

    console.log('🔄 RideFlowManager - Dados do booking:', {
      id: booking.id,
      ride_status: booking.ride_status,
      status_driver: booking.status_driver,
      status_passenger: booking.status_passenger,
      final_price: booking.final_price,
      estimated_price: booking.estimated_price,
      payment_confirmation_status: booking.payment_confirmation_status,
      userType
    });

    if (userType === 'passenger') {
      // Verifica se driver enviou oferta
      const hasDriverOffer = (
        booking.final_price && 
        booking.final_price !== booking.estimated_price &&
        booking.status_passenger !== 'offer_accepted'
      );

      console.log('👀 Passenger - Verificando ofertas:', {
        hasDriverOffer,
        final_price: booking.final_price,
        estimated_price: booking.estimated_price,
        status_passenger: booking.status_passenger
      });

      if (hasDriverOffer) {
        console.log('💰 Mostrando modal de oferta para passageiro');
        setCurrentStep('offer_acceptance');
      } else if (booking.status_passenger === 'offer_accepted' && 
                 booking.payment_confirmation_status === 'waiting_for_payment') {
        console.log('💳 Mostrando instruções de pagamento');
        setCurrentStep('payment_instructions');
      } else if (booking.payment_confirmation_status === 'all_set') {
        console.log('✅ Mostrando confirmação all_set');
        setCurrentStep('all_set_confirmation');
      } else {
        setCurrentStep(null);
      }
    } else if (userType === 'driver') {
      if (booking.payment_confirmation_status === 'passenger_paid') {
        console.log('💰 Driver - Passageiro pagou, mostrar confirmação');
        setCurrentStep('driver_payment_confirmation');
      } else if (booking.payment_confirmation_status === 'all_set') {
        console.log('✅ Driver - All set confirmation');
        setCurrentStep('all_set_confirmation');
      } else {
        setCurrentStep(null);
      }
    }
  }, [booking, userType, forceOpenStep]);

  const handleOfferAccepted = async () => {
    try {
      console.log('✅ Aceitando oferta para booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        status_passenger: 'offer_accepted',
        payment_confirmation_status: 'waiting_for_payment'
      });

      console.log('✅ Oferta aceita com sucesso');
      setCurrentStep('payment_instructions');
      onFlowComplete(); // Força refresh do componente pai
    } catch (error) {
      console.error('❌ Erro ao aceitar oferta:', error);
    }
  };

  const handlePaymentConfirmed = async () => {
    try {
      console.log('💳 Confirmando pagamento para booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'passenger_paid',
        passenger_payment_confirmed_at: new Date().toISOString()
      });

      console.log('✅ Pagamento confirmado com sucesso');
      setCurrentStep(null);
      onFlowComplete(); // Força refresh do componente pai
    } catch (error) {
      console.error('❌ Erro ao confirmar pagamento:', error);
    }
  };

  const handleDriverPaymentConfirmed = async () => {
    try {
      console.log('💰 Driver confirmando pagamento para booking:', booking.id);
      
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'all_set',
        driver_payment_confirmed_at: new Date().toISOString()
      });

      console.log('✅ Driver confirmou pagamento');
      setCurrentStep('all_set_confirmation');
      onFlowComplete(); // Força refresh do componente pai
    } catch (error) {
      console.error('❌ Erro na confirmação do driver:', error);
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
