
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
  if (!booking) return null;

  // Determine what modal should be available to reopen
  const unifiedStatus = getUnifiedStatus(booking);
  const requiredModal = getRequiredModal(unifiedStatus, userType);

  // Only show button if there's a modal that can be reopened
  if (!requiredModal) return null;

  const getModalLabel = (modalType: string): string => {
    switch (modalType) {
      case 'offer_acceptance':
        return 'Review Offer';
      case 'payment_instructions':
        return 'Payment Info';
      case 'driver_payment_confirmation':
        return 'Confirm Payment';
      case 'all_set_confirmation':
        return 'View Details';
      case 'driver_ride_request':
        return 'Ride Request';
      default:
        return 'View Details';
    }
  };

  const handleClick = () => {
    console.log('🔄 Reopening modal:', requiredModal);
    onReopenModal(requiredModal);
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={`${className} border-primary/30 hover:bg-primary/10 text-primary font-medium`}
    >
      <Eye className="h-4 w-4 mr-2" />
      {getModalLabel(requiredModal)}
    </Button>
  );
};
