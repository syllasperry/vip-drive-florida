
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateBookingStatus } from "@/utils/bookingHelpers";

interface PriceOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onUpdate: () => void;
}

export const PriceOfferModal = ({ isOpen, onClose, booking, onUpdate }: PriceOfferModalProps) => {
  const [offerPrice, setOfferPrice] = useState(booking?.estimated_price?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!booking || !offerPrice) return;

    setIsSubmitting(true);
    try {
      await updateBookingStatus(booking.id, {
        final_price: parseFloat(offerPrice),
        status: 'offer_sent',
        ride_status: 'offer_sent',
        payment_confirmation_status: 'price_awaiting_acceptance'
      });

      toast({
        title: "Offer Sent",
        description: `Price offer of $${offerPrice} sent to passenger.`,
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Price Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="price">Offer Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Enter your price offer"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!offerPrice || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Sending..." : "Send Offer"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
