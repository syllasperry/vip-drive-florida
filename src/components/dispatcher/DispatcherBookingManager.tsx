
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  car_make: string | null;
  car_model: string | null;
}

interface Booking {
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    loadDrivers();
    
    // Set up real-time subscription for bookings
    const channel = supabase
      .channel('dispatcher-booking-manager')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Dispatcher booking manager real-time update:', payload);
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading bookings for dispatcher assignment...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('id, pickup_location, dropoff_location, pickup_time, status, ride_status, payment_confirmation_status, passenger_id, driver_id, vehicle_type, estimated_price, final_price')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedBookings: Booking[] = (data || []).map(booking => {
        // Only show truly unassigned bookings (no driver_id and no offer sent)
        const isUnassigned = !booking.driver_id && !booking.final_price;
        const simpleStatus = isUnassigned ? 'booking_requested' : mapToSimpleStatus(booking);
        
        console.log('📋 Processing booking for dispatcher assignment:', {
          id: booking.id,
          status: booking.status,
          ride_status: booking.ride_status,
          payment_confirmation_status: booking.payment_confirmation_status,
          driver_id: booking.driver_id,
          final_price: booking.final_price,
          isUnassigned,
          simpleStatus
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
      console.log('📊 Bookings loaded for dispatcher assignment:', processedBookings.length);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    }
  };

  const mapToSimpleStatus = (booking: any): string => {
    if (booking.status === 'completed' || booking.ride_status === 'completed') return 'completed';
    if (booking.status === 'cancelled') return 'cancelled';
    if (booking.payment_confirmation_status === 'all_set' || booking.ride_status === 'all_set') return 'all_set';
    if (booking.ride_status === 'offer_sent' || booking.payment_confirmation_status === 'price_awaiting_acceptance') return 'payment_pending';
    return 'booking_requested';
  };

  const loadDrivers = async () => {
    try {
      console.log('🚗 Loading active drivers...');
      
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, email, phone, car_make, car_model')
        .eq('status', 'active');

      if (error) throw error;

      const processedDrivers: Driver[] = (data || []).map(driver => ({
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
      console.error('❌ Error loading drivers:', error);
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
      console.log('👨‍💼 Dispatcher manually assigning driver:', {
        booking_id: selectedBooking,
        driver_id: selectedDriver
      });

      const { error } = await supabase
        .from('bookings')
        .update({ 
          driver_id: selectedDriver,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedBooking);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver assigned successfully! You can now send an offer.",
      });

      // Force reload of bookings to reflect assignment
      await loadBookings();
      setSelectedBooking("");
      setSelectedDriver("");
      
      if (onUpdate) {
        onUpdate();
      }
      
      console.log('✅ Manual driver assignment completed successfully');
    } catch (error) {
      console.error('❌ Error assigning driver:', error);
      toast({
        title: "Error",
        description: "Failed to assign driver",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter for bookings that truly need manual assignment
  const unassignedBookings = bookings.filter(booking => {
    // Show bookings that have no driver AND no offer sent yet
    const isUnassigned = !booking.driver_id && !booking.final_price;
    const isNewRequest = ['pending', 'booking_requested'].includes(booking.status) || 
                        booking.simple_status === 'booking_requested';
    
    console.log('🔍 Checking booking for manual assignment:', {
      id: booking.id,
      driver_id: booking.driver_id,
      final_price: booking.final_price,
      status: booking.status,
      simple_status: booking.simple_status,
      isUnassigned,
      isNewRequest,
      shouldShow: isUnassigned && isNewRequest
    });
    
    return isUnassigned && isNewRequest;
  });

  console.log('📋 Unassigned bookings available for dispatcher:', unassignedBookings.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Driver to Booking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Select Unassigned Booking</label>
            <Select value={selectedBooking} onValueChange={setSelectedBooking}>
              <SelectTrigger>
                <SelectValue placeholder="Choose unassigned booking" />
              </SelectTrigger>
              <SelectContent>
                {unassignedBookings.length > 0 ? (
                  unassignedBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      #{booking.id.slice(-8).toUpperCase()} - {booking.pickup_location} → {booking.dropoff_location} (${booking.estimated_price || 0})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-bookings" disabled>
                    No unassigned bookings available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Showing {unassignedBookings.length} booking(s) requiring manual assignment
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Select Available Driver</label>
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
            <p className="text-xs text-gray-500 mt-1">
              {drivers.length} active driver(s) available
            </p>
          </div>
        </div>

        <Button 
          onClick={assignDriver} 
          disabled={!selectedBooking || !selectedDriver || isAssigning || selectedBooking === "no-bookings"}
          className="w-full"
        >
          {isAssigning ? "Assigning Driver..." : "Assign Driver to Booking"}
        </Button>
        
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
          <strong>Note:</strong> After assigning a driver, use the "Manage" button in the booking list to send the offer price to the passenger.
        </div>
      </CardContent>
    </Card>
  );
};
