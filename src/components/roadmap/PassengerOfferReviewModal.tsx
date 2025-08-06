import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, DollarSign, X, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { updateBookingWithTransition } from "@/utils/roadmapStatusManager";

interface PassengerOfferReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: () => void;
  onDecline: () => void;
}

export const PassengerOfferReviewModal = ({
  isOpen,
  onClose,
  booking,
  onAccept,
  onDecline
}: PassengerOfferReviewModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await updateBookingWithTransition(booking.id, 'offer_accepted', {
        status_passenger: 'offer_accepted'
      });
      
      toast({
        title: "Offer Accepted!",
        description: "Please proceed with payment instructions.",
      });
      
      onAccept();
      onClose();
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "Failed to accept offer. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      await updateBookingWithTransition(booking.id, 'offer_declined', {
        status_passenger: 'offer_declined'
      });
      
      toast({
        title: "Offer Declined",
        description: "Ride request has been cancelled.",
        variant: "destructive"
      });
      
      onDecline();
      onClose();
    } catch (error) {
      console.error('Error declining offer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      const date = new Date(dateTimeString);
      return {
        date: format(date, "MMM d, yyyy"),
        time: format(date, "h:mm a")
      };
    } catch {
      return { date: "Invalid date", time: "Invalid time" };
    }
  };

  if (!booking) return null;

  const { date, time } = formatDateTime(booking.pickup_time);
  const driverName = booking.drivers?.full_name || "Your Driver";
  const finalPrice = booking.final_price || booking.estimated_price || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-md mx-auto bg-background border shadow-lg">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            💰 Driver Offer Received
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
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.drivers?.profile_photo_url} 
                    alt={driverName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {driverName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{driverName}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Car className="h-3 w-3" />
                    <span>{booking.vehicle_type}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">PICKUP</p>
                  <p className="font-medium text-sm">{booking.pickup_location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-4 w-4 flex items-center justify-center mt-0.5">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">DROP-OFF</p>
                  <p className="font-medium text-sm">{booking.dropoff_location}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{date} at {time}</span>
              </div>
            </CardContent>
          </Card>

          {/* Price Offer */}
          <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <span className="text-3xl font-bold text-green-600">${finalPrice}</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Driver's Final Price
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isLoading}
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            >
              Decline Offer
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? "Accepting..." : "Accept Offer"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center px-2">
            By accepting, you agree to pay the driver directly using their preferred payment method
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};