
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateBookingStatus } from "@/utils/bookingHelpers";

interface OfferAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: () => void;
  onDecline: () => void;
}

export const OfferAcceptanceModal = ({ isOpen, onClose, booking, onAccept, onDecline }: OfferAcceptanceModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await updateBookingStatus(booking.id, {
        status_passenger: 'offer_accepted',
        payment_confirmation_status: 'waiting_for_payment'
      });

      toast({
        title: "Offer Accepted",
        description: "You have accepted the offer. Please proceed with payment.",
      });

      onAccept();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to accept offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await updateBookingStatus(booking.id, {
        status: 'cancelled',
        status_passenger: 'offer_declined'
      });

      toast({
        title: "Offer Declined",
        description: "You have declined the offer.",
      });

      onDecline();
    } catch (error) {
      console.error('Error declining offer:', error);
      toast({
        title: "Error",
        description: "Failed to decline offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review Ride Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold">${booking.final_price}</h3>
            <p className="text-gray-600">Ride offer from your driver</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>From:</span>
              <span className="font-medium">{booking.pickup_location}</span>
            </div>
            <div className="flex justify-between">
              <span>To:</span>
              <span className="font-medium">{booking.dropoff_location}</span>
            </div>
            <div className="flex justify-between">
              <span>Passengers:</span>
              <span className="font-medium">{booking.passenger_count}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Accept Offer"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isProcessing}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
