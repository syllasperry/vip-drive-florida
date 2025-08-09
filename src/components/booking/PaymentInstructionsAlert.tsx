
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check } from "lucide-react";
import { updateBookingStatus } from "@/utils/bookingHelpers";

interface PaymentInstructionsAlertProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
}

export const PaymentInstructionsAlert = ({ isOpen, onClose, booking, onPaymentConfirmed }: PaymentInstructionsAlertProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  const handlePaymentConfirmed = async () => {
    setIsConfirming(true);
    try {
      await updateBookingStatus(booking.id, {
        payment_confirmation_status: 'passenger_paid',
        status_passenger: 'payment_confirmed'
      });

      toast({
        title: "Payment Confirmed",
        description: "Your payment has been confirmed. Your driver will be notified.",
      });

      onPaymentConfirmed();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <Alert className="mb-4">
      <CreditCard className="h-4 w-4" />
      <AlertTitle>Payment Required</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Please pay ${booking.final_price} to complete your booking.
        </p>
        <div className="space-y-2">
          <p className="font-medium">Payment Instructions:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Use your preferred payment method</li>
            <li>Include booking reference: #{booking.id.slice(-8).toUpperCase()}</li>
            <li>Confirm payment once completed</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePaymentConfirmed} disabled={isConfirming} className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            {isConfirming ? "Confirming..." : "I've Paid - Confirm"}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
