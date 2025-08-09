
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Users, Car } from "lucide-react";

interface DriverRideRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAccept: (price: number) => void;
  onDecline: () => void;
}

export const DriverRideRequestModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  onAccept, 
  onDecline 
}: DriverRideRequestModalProps) => {
  const [offerPrice, setOfferPrice] = useState(booking?.estimated_price?.toString() || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid offer price.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onAccept(parseFloat(offerPrice));
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await onDecline();
    } catch (error) {
      console.error('Error declining ride:', error);
      toast({
        title: "Error",
        description: "Failed to decline ride. Please try again.",
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
          <DialogTitle>New Ride Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Trip Details */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Pickup</p>
                <p className="font-medium">{booking.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">Drop-off</p>
                <p className="font-medium">{booking.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* Trip Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                {new Date(booking.pickup_time).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{booking.passenger_count} passengers</span>
            </div>
          </div>

          {booking.vehicle_type && (
            <div className="flex items-center space-x-2">
              <Car className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{booking.vehicle_type}</span>
            </div>
          )}

          {/* Price Offer */}
          <div>
            <Label htmlFor="price">Your Offer Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Enter your price"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={!offerPrice || isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Accept & Send Offer"}
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
