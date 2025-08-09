
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User, Car, Phone } from "lucide-react";

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

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  estimated_price: number;
  status: string;
  passenger_id: string;
  passengers?: {
    full_name: string;
    phone: string;
  };
}

interface DispatcherBookingManagerProps {
  booking: Booking;
  onUpdate: () => void;
}

export const DispatcherBookingManager = ({ booking, onUpdate }: DispatcherBookingManagerProps) => {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          id,
          full_name,
          phone,
          email,
          car_make,
          car_model,
          car_color,
          license_plate
        `)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId || !offerPrice) {
      toast({
        title: "Error",
        description: "Please select a driver and enter an offer price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          driver_id: selectedDriverId,
          final_price: parseFloat(offerPrice),
          status: 'offer_sent'
        })
        .eq('id', booking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver assigned and offer sent to passenger",
      });

      setIsModalOpen(false);
      setOfferPrice('');
      setSelectedDriverId('');
      onUpdate();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
      >
        Assign Driver & Send Offer
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Driver & Send Offer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{booking.passengers?.full_name || 'Unknown'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {booking.pickup_location} → {booking.dropoff_location}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>Estimated: ${booking.estimated_price}</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="driver">Select Driver</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{driver.full_name}</span>
                        <Car className="h-4 w-4 ml-2" />
                        <span className="text-sm text-muted-foreground">
                          {driver.car_make} {driver.car_model}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Offer Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Enter offer price"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignDriver}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Assigning..." : "Assign & Send Offer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
