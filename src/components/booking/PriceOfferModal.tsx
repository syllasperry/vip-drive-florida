
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriceOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onUpdate: () => void;
}

export const PriceOfferModal = ({ isOpen, onClose, booking, onUpdate }: PriceOfferModalProps) => {
  const [offerPrice, setOfferPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!booking || !offerPrice) {
      toast({
        title: "Error",
        description: "Please enter a valid price offer.",
        variant: "destructive",
      });
      return;
    }

    const numericPrice = parseFloat(offerPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid numeric price greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('💰 Dispatcher sending price offer:', {
        booking_id: booking.id,
        offer_price: numericPrice
      });

      // Update booking with dispatcher's offer price and status
      const { error } = await supabase
        .from('bookings')
        .update({
          final_price: numericPrice, // Set the dispatcher's offer price
          estimated_price: numericPrice, // Also update estimated_price for consistency
          status: 'offer_sent',
          ride_status: 'offer_sent',
          payment_confirmation_status: 'price_awaiting_acceptance',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) {
        console.error('❌ Error sending offer:', error);
        throw error;
      }

      console.log('✅ Price offer sent successfully');

      toast({
        title: "Offer Sent",
        description: `Price offer of $${offerPrice} sent to passenger.`,
      });

      onUpdate();
      onClose();
      setOfferPrice(""); // Reset form
    } catch (error) {
      console.error('❌ Error sending offer:', error);
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
              min="0"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Enter your price offer (e.g., 150)"
              className="h-11"
            />
            <p className="text-xs text-gray-500 mt-1">
              This price will be sent to the passenger for acceptance and payment.
            </p>
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
