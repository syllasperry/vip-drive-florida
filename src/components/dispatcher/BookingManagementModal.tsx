
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Driver {
  id: string;
  full_name: string;
  phone?: string;
  profile_photo_url?: string;
  car_make?: string;
  car_model?: string;
  car_color?: string;
  license_plate?: string;
  vehicle_type?: string;
  vehicle_category?: string;
}

interface BookingManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  bookingId: string;
  drivers: Driver[];
  onUpdate: () => void;
  onSendOffer: (bookingId: string, driverId: string, price: number) => Promise<void>;
}

export const BookingManagementModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  bookingId,
  drivers: _unusedDrivers, // Keep for compatibility but don't use
  onUpdate,
  onSendOffer
}: BookingManagementModalProps) => {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    
    console.log('[MODAL][LOADING_ALL_DRIVERS]', { isOpen });
    
    (async () => {
      try {
        setLoadingDrivers(true);
        setDrivers([]); // Clear previous drivers
        
        // Fetch all active drivers from the system
        const { data, error } = await supabase
          .from('drivers')
          .select('*')
          .eq('status', 'active')
          .order('full_name');
        
        if (error) {
          console.error('[MODAL][ALL_DRIVERS_LOAD_ERROR]', error);
          throw error;
        }
        
        console.log('[MODAL][ALL_DRIVERS_LOADED]', { result: data, count: data?.length });
        setDrivers(data || []);
      } catch (e) {
        console.error('[MODAL][DRIVERS_LOAD_ERROR]', e);
        toast({
          title: "Error",
          description: `Failed to load drivers: ${String(e)}`,
          variant: "destructive",
        });
      } finally {
        setLoadingDrivers(false);
      }
    })();
  }, [isOpen, toast]);

  const handleSendOffer = async () => {
    console.log('[SEND_OFFER][CLICK]', { bookingId: booking?.id || bookingId, selectedDriverId: selectedDriver, offerPrice });
    
    if (!selectedDriver) {
      toast({
        title: "Error",
        description: "Select a driver first.",
        variant: "destructive",
      });
      return;
    }

    if (!drivers.some(d => d.id === selectedDriver)) {
      toast({
        title: "Error",
        description: "Selected driver is not available.",
        variant: "destructive",
      });
      return;
    }

    if (!offerPrice) {
      toast({
        title: "Error",
        description: "Please enter an offer price.",
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
            <Select value={selectedDriver} onValueChange={setSelectedDriver} disabled={loadingDrivers || drivers.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loadingDrivers ? "Loading drivers..." : drivers.length === 0 ? "No eligible drivers" : "Choose a driver"} />
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
              disabled={!selectedDriver || !offerPrice || isSubmitting || drivers.length === 0}
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
