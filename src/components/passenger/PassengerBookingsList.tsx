
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { getPassengerBookings } from "@/lib/api/bookings";
import { useToast } from "@/hooks/use-toast";

interface PassengerBookingsListProps {
  onUpdate?: () => Promise<void>;
}

export const PassengerBookingsList = ({ onUpdate }: PassengerBookingsListProps) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getPassengerBookings();
      
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading passenger bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

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

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No bookings found</div>
        </CardContent>
      </Card>
    );
  }

  return (
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
                {booking.pickup_time && format(new Date(booking.pickup_time), 'MMM dd, HH:mm')}
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

              {booking.driver_name && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <div className="text-sm">
                    <div className="font-medium">{booking.driver_name}</div>
                  </div>
                </div>
              )}

              {booking.final_price && (
                <div className="text-right">
                  <span className="text-lg font-semibold text-green-600">
                    ${booking.final_price}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
