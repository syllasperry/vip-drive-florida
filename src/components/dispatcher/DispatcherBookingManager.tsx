
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SimpleDriver {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  car_make: string | null;
  car_model: string | null;
}

interface SimpleBooking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  status: string;
  passenger_id: string;
  driver_id: string | null;
  vehicle_type: string | null;
  estimated_price: number | null;
  final_price: number | null;
}

interface DispatcherBookingManagerProps {
  onUpdate?: () => void;
}

export const DispatcherBookingManager = ({ onUpdate }: DispatcherBookingManagerProps) => {
  const [bookings, setBookings] = useState<SimpleBooking[]>([]);
  const [drivers, setDrivers] = useState<SimpleDriver[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    loadDrivers();
  }, []);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, pickup_location, dropoff_location, pickup_time, status, passenger_id, driver_id, vehicle_type, estimated_price, final_price')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const simpleBookings: SimpleBooking[] = (data || []).map(booking => ({
        id: booking.id,
        pickup_location: booking.pickup_location || '',
        dropoff_location: booking.dropoff_location || '',
        pickup_time: booking.pickup_time || '',
        status: booking.status || 'pending',
        passenger_id: booking.passenger_id || '',
        driver_id: booking.driver_id,
        vehicle_type: booking.vehicle_type,
        estimated_price: booking.estimated_price,
        final_price: booking.final_price
      }));

      setBookings(simpleBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    }
  };

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, email, phone, car_make, car_model')
        .eq('status', 'active');

      if (error) throw error;

      const simpleDrivers: SimpleDriver[] = (data || []).map(driver => ({
        id: driver.id,
        full_name: driver.full_name || 'Unknown',
        email: driver.email || '',
        phone: driver.phone,
        car_make: driver.car_make,
        car_model: driver.car_model
      }));

      setDrivers(simpleDrivers);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    }
  };

  const assignDriver = async () => {
    if (!selectedBooking || !selectedDriver) {
      toast({
        title: "Error",
        description: "Please select both a booking and a driver",
        variant: "destructive",
      });
      return;
    }

    setIsAssigning(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          driver_id: selectedDriver,
          status: 'assigned'
        })
        .eq('id', selectedBooking);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver assigned successfully",
      });

      await loadBookings();
      setSelectedBooking("");
      setSelectedDriver("");
      
      // Call onUpdate if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter for truly unassigned bookings only
  const unassignedBookings = bookings.filter(b => !b.driver_id && b.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Driver to Booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Select Booking</label>
            <Select value={selectedBooking} onValueChange={setSelectedBooking}>
              <SelectTrigger>
                <SelectValue placeholder="Choose unassigned booking" />
              </SelectTrigger>
              <SelectContent>
                {unassignedBookings.length > 0 ? (
                  unassignedBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.pickup_location} → {booking.dropoff_location} (${booking.estimated_price || booking.final_price || 0})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-bookings" disabled>
                    No unassigned bookings available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Select Driver</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose available driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name} ({driver.car_make} {driver.car_model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={assignDriver} 
          disabled={!selectedBooking || !selectedDriver || isAssigning || selectedBooking === "no-bookings"}
          className="w-full"
        >
          {isAssigning ? "Assigning..." : "Assign Driver"}
        </Button>
      </CardContent>
    </Card>
  );
};
