
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, User, Car } from "lucide-react";

// Simplified local interface to avoid circular type issues
interface SimpleBooking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  estimated_price?: number;
  final_price?: number;
  passenger_id: string;
  driver_id?: string;
}

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  car_make: string;
  car_model: string;
  car_color: string;
  license_plate: string;
}

interface DispatcherBookingManagerProps {
  booking: SimpleBooking;
  onUpdate: () => void;
}

export const DispatcherBookingManager = ({ booking, onUpdate }: DispatcherBookingManagerProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleSendOffer = async () => {
    if (!offerPrice || !selectedDriverId) {
      toast({
        title: "Missing Information",
        description: "Please select a driver and enter an offer price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const priceValue = parseFloat(offerPrice);
      
      // Update booking with offer price and manually assigned driver
      const { error } = await supabase
        .from('bookings')
        .update({
          final_price: priceValue,
          driver_id: selectedDriverId,
          status: 'offer_sent',
          ride_status: 'offer_sent',
          status_driver: 'offer_sent',
          payment_confirmation_status: 'waiting_for_passenger',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Offer Sent Successfully",
        description: `Offer of $${priceValue} sent to passenger with assigned driver`,
      });

      setIsModalOpen(false);
      setOfferPrice('');
      setSelectedDriverId('');
      onUpdate();
    } catch (error) {
      console.error('Error sending offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCommission = (price: number) => {
    return (price * 0.20).toFixed(2);
  };

  const calculateDriverAmount = (price: number) => {
    return (price * 0.80).toFixed(2);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfferPrice(e.target.value);
  };

  const handleDriverChange = (value: string) => {
    setSelectedDriverId(value);
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700 text-white">
          <DollarSign className="w-4 h-4 mr-2" />
          Send Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send Price Offer</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Driver Selection */}
          <div>
            <Label htmlFor="driver" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Assign Driver</span>
            </Label>
            <Select value={selectedDriverId} onValueChange={handleDriverChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4" />
                      <span>{driver.full_name} - {driver.car_make} {driver.car_model}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Input */}
          <div>
            <Label htmlFor="price">Offer Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={offerPrice}
              onChange={handlePriceChange}
              placeholder="Enter offer price"
            />
          </div>

          {/* Price Breakdown */}
          {offerPrice && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Price Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Price:</span>
                  <span className="font-semibold">${offerPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Commission (20%):</span>
                  <span>${calculateCommission(parseFloat(offerPrice))}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span>Driver Amount (80%):</span>
                  <span className="font-semibold">${calculateDriverAmount(parseFloat(offerPrice))}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendOffer}
              disabled={loading || !offerPrice || !selectedDriverId}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? "Sending..." : "Send Offer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
