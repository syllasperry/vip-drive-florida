import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DollarSign, CheckCircle, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { updateBookingWithTransition } from "@/utils/roadmapStatusManager";

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
      await updateBookingWithTransition(booking.id, 'payment_confirmed', {
        status_driver: 'payment_confirmed',
        driver_payment_confirmed_at: new Date().toISOString()
      });

      toast({
        title: "Payment Confirmed!",
        description: "Ride is now ready for pickup. Safe travels!",
      });

      onPaymentConfirmed();
      onClose();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  if (!booking) return null;

  const passengerName = booking.passenger_name || 
                       `${booking.passenger_first_name || ''} ${booking.passenger_last_name || ''}`.trim() || 
                       'Passenger';
  const amount = booking.final_price || booking.estimated_price || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-md mx-auto bg-background border shadow-lg">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            💰 Payment Received?
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Passenger Information */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.passenger_photo_url || booking.passenger_photo} 
                    alt={passengerName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {passengerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{passengerName}</h3>
                  <p className="text-sm text-muted-foreground">
                    Confirmed payment sent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Amount */}
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span className="text-3xl font-bold text-green-600">${amount}</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Amount Received
              </p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-3">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Please confirm:</p>
                <p>• You have received the payment via your preferred method</p>
                <p>• The amount matches the agreed price</p>
                <p>• You're ready to proceed with pickup</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            >
              {isConfirming ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-pulse" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Payment Received
                </>
              )}
            </Button>

            {onMessagePassenger && (
              <Button
                variant="outline"
                onClick={onMessagePassenger}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message Passenger
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center px-2">
            Once confirmed, the ride will be marked as "All Set" and ready for pickup
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};