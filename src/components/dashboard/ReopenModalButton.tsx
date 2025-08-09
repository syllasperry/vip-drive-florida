
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ReopenModalButtonProps {
  booking: any;
  onReopenModal: (step: string) => void;
}

export const ReopenModalButton = ({ booking, onReopenModal }: ReopenModalButtonProps) => {
  const getRequiredStep = () => {
    if (booking.ride_status === 'offer_sent') {
      return 'offer_acceptance';
    } else if (booking.payment_confirmation_status === 'waiting_for_payment') {
      return 'payment_instructions';
    } else if (booking.payment_confirmation_status === 'passenger_paid') {
      return 'driver_payment_confirmation';
    }
    return null;
  };

  const step = getRequiredStep();
  
  if (!step) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onReopenModal(step)}
      className="flex items-center space-x-1"
    >
      <RotateCcw className="w-3 h-3" />
      <span>Reopen</span>
    </Button>
  );
};
