import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Info, CheckCircle } from "lucide-react";
import { useState } from "react";

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: string;
  paymentInstructions: string;
  driverName: string;
  booking: any;
  onPaymentConfirmed: () => void;
}

export const PaymentInstructionsModal = ({ 
  isOpen, 
  onClose, 
  paymentMethod,
  paymentInstructions,
  driverName,
  booking,
  onPaymentConfirmed
}: PaymentInstructionsModalProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePaymentConfirmation = async () => {
    setIsConfirming(true);
    try {
      await onPaymentConfirmed();
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Instructions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Driver:</h4>
                <p className="text-primary font-medium">
                  {driverName}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Payment Method:</h4>
                <p className="text-primary font-medium">
                  {paymentMethod || "Contact driver for payment details"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Instructions:</h4>
                <p className="text-foreground whitespace-pre-line">
                  {paymentInstructions || "Please contact your driver for specific payment instructions."}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Amount:</h4>
                <p className="text-xl font-bold text-primary">
                  ${booking?.final_price || booking?.estimated_price || 0}
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Complete your payment using the method above, then confirm below to notify your driver.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentConfirmation}
            disabled={isConfirming}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isConfirming ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                I've Completed Payment
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};