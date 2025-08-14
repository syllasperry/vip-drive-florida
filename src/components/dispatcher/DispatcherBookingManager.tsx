
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DispatcherBooking {
  booking_id: string;
  status: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email?: string;
  passenger_image?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  driver_image?: string;
  vehicle_model?: string;
  created_at: string;
  final_price?: number;
}

export const DispatcherBookingManager = () => {
  const [bookings, setBookings] = useState<DispatcherBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      // Query the bookings table with proper joins
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          pickup_time,
          pickup_location,
          dropoff_location,
          final_price,
          created_at,
          passengers!inner (
            full_name,
            phone,
            email,
            profile_photo_url
          ),
          drivers (
            full_name,
            phone,
            email,
            profile_photo_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Map data to expected format
      const mappedData: DispatcherBooking[] = (data || []).map(booking => ({
        booking_id: booking.id,
        status: booking.status,
        pickup_time: booking.pickup_time,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        passenger_name: booking.passengers?.full_name || 'Unknown',
        passenger_phone: booking.passengers?.phone || '',
        passenger_email: booking.passengers?.email,
        passenger_image: booking.passengers?.profile_photo_url,
        driver_name: booking.drivers?.full_name,
        driver_phone: booking.drivers?.phone,
        driver_email: booking.drivers?.email,
        driver_image: booking.drivers?.profile_photo_url,
        created_at: booking.created_at,
        final_price: booking.final_price
      }));

      setBookings(mappedData);
    } catch (error) {
      console.error('Error loading dispatcher bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'all_set':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading bookings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">No bookings found</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.booking_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {format(new Date(booking.pickup_time), 'MMM dd, HH:mm')}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="font-medium">{booking.pickup_location}</div>
                      <div className="text-gray-500">→ {booking.dropoff_location}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div className="text-sm">
                        <div className="font-medium">{booking.passenger_name}</div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.passenger_phone}
                        </div>
                      </div>
                    </div>

                    {booking.driver_name ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <div className="text-sm">
                          <div className="font-medium">{booking.driver_name}</div>
                          <div className="text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {booking.driver_phone}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No driver assigned</div>
                    )}
                  </div>

                  {booking.final_price && (
                    <div className="text-right">
                      <span className="text-lg font-semibold text-green-600">
                        ${booking.final_price}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {!booking.driver_name && (
                    <Button size="sm">
                      Assign Driver
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
