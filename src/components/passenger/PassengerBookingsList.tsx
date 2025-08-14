
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { getPassengerBookingsByAuth } from "@/lib/api/bookings";
import { useToast } from "@/hooks/use-toast";

export const PassengerBookingsList = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getPassengerBookingsByAuth();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setBookings(data);
        console.log('Loaded bookings:', data.length);
      } else {
        console.warn('Expected array but got:', typeof data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading passenger bookings:', error);
      setBookings([]);
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
    switch (status?.toLowerCase()) {
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
        <CardTitle>Your Bookings</CardTitle>
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
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
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

                  {booking.drivers ? (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" />
                      <div className="text-sm">
                        <div className="font-medium">{booking.drivers.full_name}</div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.drivers.phone}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No driver assigned</div>
                  )}

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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
