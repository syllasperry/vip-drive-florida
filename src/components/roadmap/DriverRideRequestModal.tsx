import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, User, Car, DollarSign, Phone, X } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { updateBookingWithTransition } from "@/utils/roadmapStatusManager";

interface DriverRideRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: () => void;
  onDecline: () => void;
  onSendOffer: () => void;
}

export const DriverRideRequestModal = ({
  isOpen,
  onClose,
  booking,
  onAccept,
  onDecline,
  onSendOffer
}: DriverRideRequestModalProps) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timeout reached
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleTimeout = async () => {
    try {
      await updateBookingWithTransition(booking.id, 'driver_timeout');
      toast({
        title: "Request Expired",
        description: "The ride request has expired and been reassigned.",
        variant: "destructive"
      });
      onClose();
    } catch (error) {
      console.error('Error handling timeout:', error);
    }
  };

  const handleAccept = async () => {
    try {
      await updateBookingWithTransition(booking.id, 'offer_accepted', {
        status_driver: 'driver_accepted'
      });
      onAccept();
      onClose();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDecline = async () => {
    try {
      await updateBookingWithTransition(booking.id, 'offer_declined', {
        status_driver: 'driver_declined'
      });
      onDecline();
      onClose();
    } catch (error) {
      console.error('Error declining ride:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
  const passengerName = booking.passenger_name || 'Unknown Passenger';

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="max-w-md mx-auto bg-background border shadow-lg">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center justify-center gap-2">
            🚗 New Ride Request
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
          {/* Countdown Timer */}
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                Time left to respond
              </div>
            </CardContent>
          </Card>

          {/* Passenger Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={booking.passengers?.profile_photo_url || booking.passenger_photo_url || booking.passenger_photo} 
                    alt={passengerName}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {passengerName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{passengerName}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {time}
                    </span>
                    {booking.passenger_phone && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary hover:text-primary/80"
                        onClick={() => window.location.href = `tel:${booking.passenger_phone}`}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-3">
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
              </div>

              {/* Trip Info */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {booking.passenger_count || 1} pax
                  </span>
                  <span className="flex items-center gap-1">
                    <Car className="h-3 w-3" />
                    {booking.vehicle_type}
                  </span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {booking.estimated_price ? `$${booking.estimated_price}` : 'TBD'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            >
              Decline
            </Button>
            <Button
              variant="outline"
              onClick={onSendOffer}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
            >
              Send Offer
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Accept
            </Button>
          </div>

          {/* Date and Time */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            Pickup requested for {date} at {time}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};