import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Info } from "lucide-react";

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: string;
  paymentInstructions: string;
  driverName: string;
}

export const PaymentInstructionsModal = ({ 
  isOpen, 
  onClose, 
  paymentMethod,
  paymentInstructions,
  driverName
}: PaymentInstructionsModalProps) => {
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
                <h4 className="font-semibold text-foreground mb-2">Payment Method:</h4>
                <p className="text-primary font-medium">
                  {paymentMethod || "Not defined"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Instructions:</h4>
                <p className="text-foreground whitespace-pre-line">
                  {paymentInstructions || "No payment instructions provided by driver yet."}
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Once you've made the payment, please confirm using the button in the payment confirmation screen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};