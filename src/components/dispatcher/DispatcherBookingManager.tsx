
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
  simple_status: string;
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
      console.log('🔄 Loading bookings for dispatcher assignment...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('id, pickup_location, dropoff_location, pickup_time, status, passenger_id, driver_id, vehicle_type, estimated_price, final_price')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedBookings: SimpleBooking[] = (data || []).map(booking => {
        const simpleStatus = mapToSimpleStatus(booking.status);
        
        console.log('📋 Processing booking for assignment:', {
          id: booking.id,
          status: booking.status,
          simple_status: simpleStatus,
          driver_id: booking.driver_id,
          isUnassigned: !booking.driver_id
        });

        return {
          id: booking.id,
          pickup_location: booking.pickup_location || '',
          dropoff_location: booking.dropoff_location || '',
          pickup_time: booking.pickup_time || '',
          status: booking.status || 'pending',
          simple_status: simpleStatus,
          passenger_id: booking.passenger_id || '',
          driver_id: booking.driver_id,
          vehicle_type: booking.vehicle_type,
          estimated_price: booking.estimated_price,
          final_price: booking.final_price
        };
      });

      setBookings(processedBookings);
      console.log('📊 Bookings loaded for assignment:', processedBookings.length);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    }
  };

  const mapToSimpleStatus = (status: string): string => {
    switch (status) {
      case 'pending':
      case 'booking_requested':
        return 'booking_requested';
      case 'offer_sent':
      case 'payment_pending':
        return 'payment_pending';
      case 'all_set':
        return 'all_set';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'booking_requested';
    }
  };

  const loadDrivers = async () => {
    try {
      console.log('🚗 Loading active drivers...');
      
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, email, phone, car_make, car_model')
        .eq('status', 'active');

      if (error) throw error;

      const processedDrivers: SimpleDriver[] = (data || []).map(driver => ({
        id: driver.id,
        full_name: driver.full_name || 'Unknown',
        email: driver.email || '',
        phone: driver.phone,
        car_make: driver.car_make,
        car_model: driver.car_model
      }));

      setDrivers(processedDrivers);
      console.log('✅ Active drivers loaded:', processedDrivers.length);
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
      console.log('👨‍💼 Dispatcher assigning driver:', {
        booking_id: selectedBooking,
        driver_id: selectedDriver
      });

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
      
      console.log('✅ Driver assignment completed successfully');
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

  // Filter for truly unassigned bookings - include all bookings without a driver
  const unassignedBookings = bookings.filter(b => {
    const isUnassigned = !b.driver_id;
    const isNewRequest = b.simple_status === 'booking_requested';
    
    console.log('🔍 Checking booking for unassigned filter:', {
      id: b.id,
      driver_id: b.driver_id,
      isUnassigned,
      simple_status: b.simple_status,
      isNewRequest,
      shouldShow: isUnassigned && isNewRequest
    });
    
    return isUnassigned && isNewRequest;
  });

  console.log('📋 Unassigned bookings for dropdown:', unassignedBookings.length);

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
