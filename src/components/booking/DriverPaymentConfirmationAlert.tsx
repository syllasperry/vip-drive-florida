import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DriverPaymentConfirmationAlertProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
  onMessagePassenger: () => void;
}

export const DriverPaymentConfirmationAlert = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentConfirmed,
  onMessagePassenger 
}: DriverPaymentConfirmationAlertProps) => {
  const { toast } = useToast();

  const handleConfirmPaymentReceived = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          payment_confirmation_status: 'all_set',
          ride_status: 'all_set'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Payment Confirmed!",
        description: "Ride is now ready. Status updated to All Set.",
      });

      onPaymentConfirmed();
      onClose();
    } catch (error) {
      console.error('Error confirming payment receipt:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment receipt. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-sm mx-auto bg-background border shadow-lg p-4">
        <DialogHeader className="text-center space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Passenger Avatar */}
          <div className="flex justify-center">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={booking.passenger_photo_url} 
                alt={`${booking.passenger_first_name} ${booking.passenger_last_name}`}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {booking.passenger_first_name?.charAt(0)?.toUpperCase() || "P"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Passenger Name */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground">
              {booking.passenger_first_name} {booking.passenger_last_name}
            </h3>
            <p className="text-muted-foreground mt-2">
              Passenger confirmed payment
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleConfirmPaymentReceived}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full"
            >
              Confirm Payment Received
            </Button>

            <Button 
              onClick={onMessagePassenger}
              variant="outline"
              className="w-full h-12 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium rounded-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Passenger
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center px-2">
            Confirm after verifying payment in your account
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};