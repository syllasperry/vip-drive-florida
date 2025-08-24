
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Clock, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useMyBookings, type Booking } from '@/hooks/useMyBookings';

interface PassengerBookingsListProps {
  limit?: number;
  showHeader?: boolean;
}

const PassengerBookingsList: React.FC<PassengerBookingsListProps> = ({ 
  limit, 
  showHeader = true 
}) => {
  const { bookings, isLoading, error, refetch } = useMyBookings();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Bookings</h2>
            <div className="animate-spin">
              <RefreshCw className="h-5 w-5" />
            </div>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Bookings</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              Error loading bookings: {error.message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayBookings = limit ? bookings.slice(0, limit) : bookings;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateTime;
    }
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Bookings</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {displayBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
            <p className="text-muted-foreground">
              Start by creating your first booking
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayBookings.map((booking: Booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        className={getStatusColor(booking.status)}
                        variant="secondary"
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                      {booking.booking_code && (
                        <span className="text-xs text-muted-foreground font-mono">
                          #{booking.booking_code}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm">
                      {booking.vehicle_type || 'Standard Vehicle'}
                    </h4>
                  </div>
                  {booking.final_price && (
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${booking.final_price}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{booking.pickup_location}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-muted-foreground">→</span>
                    <span className="truncate">{booking.dropoff_location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(booking.pickup_time)}</span>
                  </div>
                  {booking.drivers && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Driver: {booking.drivers.full_name || 'Assigned'}
                      </span>
                    </div>
                  )}
                </div>

                {booking.passenger_count > 1 && (
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {booking.passenger_count} passengers
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Export as both named and default export to fix import issues
export { PassengerBookingsList };
export default PassengerBookingsList;
