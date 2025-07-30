import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, X, Clock, MapPin, User, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OfferAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: () => void;
  onDecline: () => void;
}

export const OfferAcceptanceModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onAccept, 
  onDecline 
}: OfferAcceptanceModalProps) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const { toast } = useToast();

  // Timer for offer expiration (15 minutes)
  useEffect(() => {
    if (!isOpen || !booking) return;

    const expiryTime = booking.payment_expires_at 
      ? new Date(booking.payment_expires_at) 
      : new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const updateTimer = () => {
      const now = new Date();
      const timeDiff = expiryTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen, booking]);

  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'waiting_for_payment',
          payment_confirmation_status: 'price_accepted'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Offer Accepted!",
        description: "Proceeding to payment instructions.",
      });

      onAccept();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to accept offer. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDecline = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          ride_status: 'offer_declined',
          payment_confirmation_status: 'offer_declined'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Offer Declined",
        description: "You can make a new request if needed.",
      });

      onDecline();
    } catch (error) {
      console.error('Error declining offer:', error);
      toast({
        title: "Error",
        description: "Failed to decline offer. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent 
        className="max-w-md mx-auto bg-background border shadow-lg"
      >
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Driver Offer Received
          </DialogTitle>
          <Badge variant="secondary" className="mx-auto">
            <Clock className="h-3 w-3 mr-1" />
            {timeLeft} remaining
          </Badge>
        </DialogHeader>

        <div className="space-y-6">
          {/* Driver Information */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.drivers?.profile_photo_url} 
                    alt={booking.drivers?.full_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {booking.drivers?.full_name?.charAt(0)?.toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {booking.drivers?.full_name || "Your Driver"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {booking.vehicle_type}
                  </p>
                </div>
              </div>

              {/* Trip Summary */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      From: {booking.pickup_location}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      To: {booking.dropoff_location}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    {booking.pickup_time ? new Date(booking.pickup_time).toLocaleDateString() : ''} at {booking.pickup_time ? new Date(booking.pickup_time).toLocaleTimeString() : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Offer */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Proposed Fare
              </p>
              <div className="flex items-center justify-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-3xl font-bold text-primary">
                  {booking.final_price?.toFixed(2) || "0.00"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Do you want to accept this ride for this price?
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleAccept}
              disabled={timeLeft === "Expired"}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              ✅ Accept Offer
            </Button>

            <Button 
              onClick={handleDecline}
              disabled={timeLeft === "Expired"}
              variant="outline"
              className="w-full h-12 border-destructive text-destructive hover:bg-destructive/10 rounded-xl"
            >
              <X className="h-5 w-5 mr-2" />
              ❌ Decline Offer
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            This offer will expire in {timeLeft}. Please make your decision promptly.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};