
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  profile_photo_url?: string;
  car_make: string;
  car_model: string;
  car_color: string;
  license_plate: string;
}

interface BookingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  drivers: Driver[];
  onUpdate: () => void;
  onSendOffer: (bookingId: string, driverId: string, price: number) => Promise<void>;
}

export const BookingManagementModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  drivers, 
  onUpdate,
  onSendOffer
}: BookingManagementModalProps) => {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSendOffer = async () => {
    if (!selectedDriver || !offerPrice) {
      toast({
        title: "Error",
        description: "Please select a driver and enter an offer price.",
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
      await onSendOffer(booking.id, selectedDriver, numericPrice);
      
      // Reset form and close modal
      setSelectedDriver("");
      setOfferPrice("");
      onClose();
    } catch (error) {
      console.error('❌ Error in modal offer sending:', error);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Booking #{booking?.id?.slice(-8).toUpperCase()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Driver Selection */}
          <div>
            <Label htmlFor="driver">Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={driver.profile_photo_url} />
                        <AvatarFallback className="text-xs">
                          {driver.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {driver.full_name} - {driver.car_make} {driver.car_model}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Offer Price */}
          <div>
            <Label htmlFor="price">Offer Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Enter price (e.g., 150)"
              className="h-11"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSendOffer}
              disabled={!selectedDriver || !offerPrice || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Sending..." : "Send Offer to Passenger"}
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
