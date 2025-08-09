
import React from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Booking } from "@/types/booking";

interface ReopenModalButtonProps {
  booking: Booking;
  onReopenModal: (step: string) => void;
}

export const ReopenModalButton = ({ booking, onReopenModal }: ReopenModalButtonProps) => {
  const handleReopen = () => {
    // Determine which modal to reopen based on booking status
    if (booking.ride_status === 'offer_sent' || booking.payment_confirmation_status === 'price_awaiting_acceptance') {
      onReopenModal('offer_acceptance');
    } else if (booking.payment_confirmation_status === 'waiting_for_payment') {
      onReopenModal('payment_instructions');
    } else if (booking.payment_confirmation_status === 'passenger_paid') {
      onReopenModal('driver_payment_confirmation');
    } else if (booking.payment_confirmation_status === 'all_set') {
      onReopenModal('all_set_confirmation');
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleReopen}
      className="p-2"
    >
      <RotateCcw className="w-4 h-4" />
    </Button>
  );
};
