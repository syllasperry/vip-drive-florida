
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandardDriverRideCard } from "../StandardDriverRideCard";
import { Booking } from "@/types/booking";
import { mapToSimpleStatus } from "@/utils/bookingHelpers";

interface OrganizedBookingsListProps {
  refreshTrigger?: number;
}

export const OrganizedBookingsList = ({ refreshTrigger }: OrganizedBookingsListProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  const loadBookings = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers:passenger_id (
            id,
            full_name,
            phone,
            profile_photo_url
          ),
          drivers:driver_id (
            full_name,
            phone,
            profile_photo_url,
            car_make,
            car_model,
            car_color,
            license_plate
          )
        `)
        .eq('driver_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedBookings: Booking[] = (data || []).map(booking => ({
        id: booking.id,
        pickup_location: booking.pickup_location || '',
        dropoff_location: booking.dropoff_location || '',
        pickup_time: booking.pickup_time || '',
        passenger_count: booking.passenger_count || 1,
        vehicle_type: booking.vehicle_type,
        status: booking.status || 'pending',
        ride_status: booking.ride_status,
        payment_confirmation_status: booking.payment_confirmation_status,
        status_passenger: booking.status_passenger,
        status_driver: booking.status_driver,
        simple_status: mapToSimpleStatus(booking),
        estimated_price: booking.estimated_price,
        final_price: booking.final_price,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        passenger_id: booking.passenger_id || '',
        driver_id: booking.driver_id,
        vehicle_id: booking.vehicle_id,
        passengers: booking.passengers ? {
          id: booking.passengers.id,
          full_name: booking.passengers.full_name,
          phone: booking.passengers.phone,
          profile_photo_url: booking.passengers.profile_photo_url
        } : undefined,
        drivers: booking.drivers
      }));

      setBookings(processedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const organizeBookings = () => {
    return {
      new: bookings.filter(b => b.simple_status === 'booking_requested'),
      active: bookings.filter(b => ['payment_pending', 'all_set'].includes(b.simple_status || '')),
      completed: bookings.filter(b => b.simple_status === 'completed')
    };
  };

  const organizedBookings = organizeBookings();

  if (loading) {
    return <div className="text-center py-4">Loading bookings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Rides</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new">New ({organizedBookings.new.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({organizedBookings.active.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({organizedBookings.completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {organizedBookings.new.length > 0 ? (
              organizedBookings.new.map(booking => (
                <StandardDriverRideCard key={booking.id} booking={booking} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No new ride requests</p>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {organizedBookings.active.length > 0 ? (
              organizedBookings.active.map(booking => (
                <StandardDriverRideCard key={booking.id} booking={booking} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No active rides</p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {organizedBookings.completed.length > 0 ? (
              organizedBookings.completed.map(booking => (
                <StandardDriverRideCard key={booking.id} booking={booking} />
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No completed rides</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
