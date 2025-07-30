import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, User, DollarSign, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PriceOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  driverProfile: any;
  onOfferSent: () => void;
}

export const PriceOfferModal = ({ isOpen, onClose, booking, driverProfile, onOfferSent }: PriceOfferModalProps) => {
  const [offerPrice, setOfferPrice] = useState(booking.estimated_fare || 50);
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendOffer = async () => {
    if (!offerPrice || offerPrice <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price amount.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'offer_sent',
          payment_confirmation_status: 'price_awaiting_acceptance',
          final_price: offerPrice,
          driver_payment_instructions: paymentInstructions || getDefaultPaymentInstructions(),
          driver_id: driverProfile.id
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Offer Sent!",
        description: "Your price offer has been sent to the passenger.",
        variant: "default"
      });

      onOfferSent();
      onClose();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getDefaultPaymentInstructions = () => {
    const instructions = [];
    if (driverProfile.venmo_info) instructions.push(`Venmo: @${driverProfile.venmo_info}`);
    if (driverProfile.zelle_info) instructions.push(`Zelle: ${driverProfile.zelle_info}`);
    if (driverProfile.apple_pay_info) instructions.push(`Apple Pay: ${driverProfile.apple_pay_info}`);
    instructions.push('Cash payment accepted at pickup');
    return instructions.join('\n');
  };

  const calculateEstimatedPrice = () => {
    // Simple estimation: base rate + distance
    const baseRate = 15;
    const perMileRate = 2;
    const distance = booking.distance_miles || 10;
    return Math.round(baseRate + (distance * perMileRate));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Send Price Offer</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ride Summary */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() : ''} at {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString() : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {booking.pickup_location}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {booking.dropoff_location}
                  </p>
                  {booking.distance_miles && (
                    <p className="text-xs text-muted-foreground">
                      Distance: {booking.distance_miles} miles
                    </p>
                  )}
                </div>
              </div>

              {booking.passengers && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    Passenger: {booking.passengers.full_name}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Price Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="price" className="text-sm font-medium">Your Price Offer</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min="1"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(parseFloat(e.target.value) || 0)}
                  className="pl-10 h-12 text-lg font-medium"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Suggested: ${calculateEstimatedPrice()} (based on distance)
              </p>
            </div>

            <div>
              <Label htmlFor="instructions" className="text-sm font-medium">Payment Instructions</Label>
              <Textarea
                id="instructions"
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder={getDefaultPaymentInstructions()}
                className="mt-1 min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include your preferred payment methods (Venmo, Zelle, etc.)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleSendOffer}
              disabled={isSending || !offerPrice}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sending Offer...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Offer - ${offerPrice}
                </div>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full h-12 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};