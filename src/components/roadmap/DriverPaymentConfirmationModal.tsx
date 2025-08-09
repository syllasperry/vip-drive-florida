
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, MessageCircle } from "lucide-react";

interface DriverPaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
  onMessagePassenger?: () => void;
}

export const DriverPaymentConfirmationModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentConfirmed, 
  onMessagePassenger 
}: DriverPaymentConfirmationModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const { toast } = useToast();

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      await onPaymentConfirmed();
      toast({
        title: "Payment Confirmed",
        description: "You have confirmed receipt of payment.",
      });
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

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payment Receipt</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Payment Received</h3>
            <p className="text-gray-600">Amount: ${booking.final_price}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              The passenger has indicated they have paid ${booking.final_price} for this ride. 
              Please confirm once you have verified receipt of payment.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isConfirming ? "Confirming..." : "Confirm Payment Received"}
            </Button>
            {onMessagePassenger && (
              <Button
                variant="outline"
                onClick={onMessagePassenger}
                className="flex-1"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message Passenger
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
