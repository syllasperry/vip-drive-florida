import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, MessageSquare, Phone } from 'lucide-react';

export interface StandardDriverRideCardProps {
  booking: any;
  onUpdate?: () => void;
  onMessagePassenger: () => void;
}

export const StandardDriverRideCard: React.FC<StandardDriverRideCardProps> = ({
  booking,
  onUpdate,
  onMessagePassenger
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAcceptRide = () => {
    // Handle ride acceptance logic
    console.log('Accepting ride:', booking.id);
    onUpdate?.();
  };

  const isAllSet = booking.status === 'all_set' || booking.ride_status === 'all_set';
  const hasPhone = booking.passengers?.phone;
  const hasEmail = booking.passengers?.email;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Ride Request #{booking.id?.slice(-6)}
          </CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Details */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">From:</span>
            <span className="font-medium">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">{booking.dropoff_location}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className="text-muted-foreground">Pickup:</span>
            <span className="font-medium">
              {new Date(booking.pickup_time).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4" />
            <span className="text-muted-foreground">Passengers:</span>
            <span className="font-medium">{booking.passenger_count}</span>
          </div>
        </div>

        {/* Passenger Info */}
        {booking.passengers && (
          <div className="border-t pt-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Passenger:</span>
              <span className="font-medium ml-1">{booking.passengers.full_name}</span>
            </div>
            {booking.passengers.phone && (
              <div className="text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium ml-1">{booking.passengers.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Price Information */}
        {(booking.estimated_price || booking.final_price) && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Fare:</span>
              <span className="font-medium text-lg">
                ${booking.final_price || booking.estimated_price}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={isAllSet && hasPhone ? onMessagePassenger : (e) => e.preventDefault()}
            aria-disabled={!isAllSet || !hasPhone}
            tabIndex={!isAllSet || !hasPhone ? -1 : undefined}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
          
          {booking.passengers?.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={isAllSet && hasPhone ? () => window.open(`tel:${booking.passengers.phone}`) : (e) => e.preventDefault()}
              aria-disabled={!isAllSet || !hasPhone}
              tabIndex={!isAllSet || !hasPhone ? -1 : undefined}
              className="flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}

          {booking.status === 'pending' && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAcceptRide}
            >
              Accept Ride
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
