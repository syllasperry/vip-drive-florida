
import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, AlertCircle } from "lucide-react";
import { getUnifiedStatus, getRequiredModal } from "@/utils/unifiedStatusManager";

interface ReopenModalButtonProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onReopenModal: (modalType: string) => void;
  className?: string;
}

export const ReopenModalButton = ({ 
  booking, 
  userType, 
  onReopenModal, 
  className = "" 
}: ReopenModalButtonProps) => {
  if (!booking) {
    console.log('❌ ReopenModalButton: No booking provided');
    return null;
  }

  // Determine what modal should be available to reopen
  const unifiedStatus = getUnifiedStatus(booking);
  const requiredModal = getRequiredModal(unifiedStatus, userType);

  console.log('🔍 ReopenModalButton Debug:', {
    unifiedStatus,
    requiredModal,
    userType,
    booking_id: booking.id,
    booking_status: booking.status,
    status_passenger: booking.status_passenger,
    status_driver: booking.status_driver,
    payment_confirmation_status: booking.payment_confirmation_status,
    ride_status: booking.ride_status,
    final_price: booking.final_price,
    estimated_price: booking.estimated_price
  });

  // Always show button if there's a callback - let the user decide when to reopen
  const shouldShowButton = () => {
    console.log('🔍 Checking if should show button for status:', unifiedStatus, 'userType:', userType);
    
    // Always show for key interactive statuses
    if (userType === 'passenger') {
      const shouldShow = ['pending', 'offer_sent', 'offer_accepted', 'payment_confirmed', 'all_set'].includes(unifiedStatus);
      console.log('🔍 Passenger should show button:', shouldShow, 'for status:', unifiedStatus);
      return shouldShow;
    } else {
      const shouldShow = ['pending', 'driver_accepted', 'offer_sent', 'payment_confirmed', 'all_set'].includes(unifiedStatus);
      console.log('🔍 Driver should show button:', shouldShow, 'for status:', unifiedStatus);
      return shouldShow;
    }
  };

  if (!shouldShowButton()) {
    console.log('❌ ReopenModalButton: Should not show button for status:', unifiedStatus, 'userType:', userType);
    return null;
  }

  const getModalLabel = (status: string): string => {
    if (userType === 'passenger') {
      switch (status) {
        case 'pending':
          return 'View Request';
        case 'offer_sent':
          return 'Review Offer';
        case 'offer_accepted':
          return 'Payment Info';
        case 'payment_confirmed':
          return 'Payment Status';
        case 'all_set':
          return 'View Details';
        default:
          return 'View Details';
      }
    } else {
      switch (status) {
        case 'pending':
          return 'Ride Request';
        case 'driver_accepted':
          return 'Send Offer';
        case 'offer_sent':
          return 'Offer Status';
        case 'payment_confirmed':
          return 'Confirm Payment';
        case 'all_set':
          return 'View Details';
        default:
          return 'View Details';
      }
    }
  };

  const getModalTypeForStatus = (status: string): string => {
    if (userType === 'passenger') {
      switch (status) {
        case 'pending':
          return 'booking_request';
        case 'offer_sent':
          return 'offer_acceptance';
        case 'offer_accepted':
          return 'payment_instructions';
        case 'payment_confirmed':
          return 'payment_status';
        case 'all_set':
          return 'all_set_confirmation';
        default:
          return 'offer_acceptance';
      }
    } else {
      switch (status) {
        case 'pending':
          return 'driver_ride_request';
        case 'driver_accepted':
          return 'price_offer';
        case 'offer_sent':
          return 'offer_status';
        case 'payment_confirmed':
          return 'driver_payment_confirmation';
        case 'all_set':
          return 'all_set_confirmation';
        default:
          return 'driver_ride_request';
      }
    }
  };

  const modalType = getModalTypeForStatus(unifiedStatus);

  const handleClick = () => {
    console.log('🔄 Reopening modal:', modalType, 'for status:', unifiedStatus);
    onReopenModal(modalType);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={`${className} border-primary/30 hover:bg-primary/10 text-primary font-medium flex items-center gap-2`}
    >
      <Eye className="h-4 w-4" />
      {getModalLabel(unifiedStatus)}
    </Button>
  );
};
