
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign, Clock, User, Car } from "lucide-react";
import { getPassengerBookingsByAuth, subscribeToBookingsAndPassengers } from "@/lib/api/bookings";
import { PassengerPreferencesCard } from "./PassengerPreferencesCard";

interface PassengerBooking {
  booking_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  status: string;
  ride_status?: string;
  payment_confirmation_status?: string;
  status_passenger?: string;
  status_driver?: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  updated_at?: string;
  passenger_id: string;
  driver_id?: string;
  passenger_name?: string;
  passenger_email?: string;
  passenger_phone?: string;
  passenger_photo_url?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  driver_photo_url?: string;
  driver_car_make?: string;
  driver_car_model?: string;
  driver_license_plate?: string;
}

export const PassengerBookingsList = () => {
  const [bookings, setBookings] = useState<PassengerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPassengerBookingsByAuth();
      console.log('Fetched passenger bookings:', data);
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching passenger bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    // Set up real-time subscription
    const subscription = subscribeToBookingsAndPassengers(() => {
      console.log('Real-time update detected, refetching bookings...');
      fetchBookings();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
      case 'all_set':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'TBD';
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-4 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <Button onClick={fetchBookings} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500">Your ride bookings will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.booking_id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(booking.status)}>
                  {booking.status?.replace('_', ' ').toUpperCase()}
                </Badge>
                {booking.payment_confirmation_status && (
                  <Badge variant="outline" className="text-xs">
                    {booking.payment_confirmation_status.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  {formatPrice(booking.final_price || booking.estimated_price)}
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="space-y-2 mb-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{booking.pickup_location}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{booking.dropoff_location}</div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateTime(booking.pickup_time)}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {booking.passenger_count} passenger{booking.passenger_count !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Driver Info */}
            {booking.driver_name && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{booking.driver_name}</div>
                    {booking.driver_car_make && booking.driver_car_model && (
                      <div className="text-sm text-gray-600">
                        {booking.driver_car_make} {booking.driver_car_model}
                        {booking.driver_license_plate && ` • ${booking.driver_license_plate}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Booking timestamp */}
            <div className="text-xs text-gray-500 mt-2">
              Booked on {formatDateTime(booking.created_at)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
