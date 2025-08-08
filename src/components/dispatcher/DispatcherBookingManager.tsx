
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [finalPrice, setFinalPrice] = useState(booking.final_negotiated_price || booking.estimated_price || '');
  const [notes, setNotes] = useState(booking.dispatcher_notes || '');
  const [selectedDriver, setSelectedDriver] = useState(booking.assigned_driver_id || '');
  const [drivers, setDrivers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('status', 'approved');
      
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleUpdateBooking = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          final_negotiated_price: parseFloat(finalPrice),
          dispatcher_notes: notes,
          assigned_driver_id: selectedDriver || null,
          simple_status: selectedDriver ? 'payment_pending' : 'booking_requested'
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Send email notification to passenger
      if (selectedDriver && finalPrice) {
        await supabase.functions.invoke('send-booking-notifications', {
          body: {
            bookingId: booking.id,
            status: 'payment_pending',
            triggerType: 'status_change'
          }
        });
      }

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      onUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking",
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
          <DialogTitle>Manage Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="finalPrice">Final Price ($)</Label>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
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

          <div>
            <Label htmlFor="notes">Dispatcher Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this booking..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBooking} disabled={loading}>
              {loading ? 'Updating...' : 'Update Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
