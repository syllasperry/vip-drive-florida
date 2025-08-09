
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

interface BookingManagerProps {
  booking: any;
  onUpdate: () => void;
}

export const DispatcherBookingManager = ({ booking, onUpdate }: BookingManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [finalPrice, setFinalPrice] = useState(booking.estimated_price || booking.final_price || '');
  const [selectedDriver, setSelectedDriver] = useState(booking.driver_id || '');
  const [drivers, setDrivers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*');
      
      if (error) {
        console.error('Error loading drivers:', error);
        throw error;
      }
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedDriver || !finalPrice) {
      toast({
        title: "Missing Information",
        description: "Please select a driver and set a price",
        variant: "destructive",
      });
      return;
    }

    const priceValue = parseFloat(finalPrice);
    if (isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Invalid Price",
        description: "Please enter a valid price greater than 0",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Updating booking with data:', {
        booking_id: booking.id,
        driver_id: selectedDriver,
        final_price: priceValue
      });

      // Update booking with driver assignment and final price
      // The SQL trigger will automatically set the status to 'offer_sent'
      const updateData = {
        driver_id: selectedDriver,
        final_price: priceValue,
        estimated_price: priceValue,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Booking updated successfully - trigger should set status to offer_sent:', data);

      toast({
        title: "Success",
        description: "Offer sent to passenger successfully",
      });

      // Force immediate refresh of the bookings list
      onUpdate();
      setIsOpen(false);
      
      // Additional safety refresh after a short delay
      setTimeout(() => {
        onUpdate();
      }, 1000);

    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: `Failed to send offer: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    loadDrivers();
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={handleOpenDialog}>
          <Settings className="h-4 w-4 mr-1" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Driver & Set Price</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="finalPrice">Final Price ($)</Label>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
              min="0"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              placeholder="Enter final price"
            />
          </div>

          <div>
            <Label htmlFor="driver">Assign Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver: any) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name} - {driver.car_make} {driver.car_model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBooking} disabled={loading}>
              {loading ? 'Sending Offer...' : 'Send Offer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
