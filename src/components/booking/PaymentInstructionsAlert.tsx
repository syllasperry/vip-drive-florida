import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { updateBookingStatus } from "@/utils/statusManager";

interface PaymentInstructionsAlertProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
}

export const PaymentInstructionsAlert = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentConfirmed 
}: PaymentInstructionsAlertProps) => {
  const { toast } = useToast();

  const handleConfirmPayment = async () => {
    try {
      // Update booking with passenger payment confirmation
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status_passenger: 'payment_confirmed',
          payment_confirmation_status: 'passenger_paid',
          ride_status: 'payment_sent_awaiting_driver_confirmation'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Payment Confirmed!",
        description: "Driver has been notified. Awaiting driver confirmation.",
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
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-sm mx-auto bg-background border shadow-lg p-4">
        <DialogHeader className="text-center space-y-1">
          <DialogTitle className="text-lg font-bold text-foreground">
            Offer Accepted!
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
          {/* Driver Information */}
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.drivers?.profile_photo_url} 
                    alt={booking.drivers?.full_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {booking.drivers?.full_name?.charAt(0)?.toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {booking.drivers?.full_name || "Your Driver"}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Car className="h-3 w-3" />
                    <span>{booking.vehicle_type}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    {booking.drivers?.preferred_payment_method || "Zelle"}
                  </span>
                  <p className="text-xs text-muted-foreground">Selected Payment Method</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-3 space-y-2">
              <div className="text-sm">
                <p className="font-medium">Driver Name: {booking.drivers?.full_name}</p>
                <p>Phone: {booking.drivers?.phone}</p>
                <p>Email: {booking.drivers?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button 
            onClick={handleConfirmPayment}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg"
          >
            Confirm Payment
          </Button>

          <p className="text-xs text-muted-foreground text-center px-2">
            Click confirm after completing your payment to notify the driver
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};