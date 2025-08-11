
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Users, MessageSquare, CreditCard, CheckCircle, Edit } from 'lucide-react';

export interface EnhancedBookingCardProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onMessage: () => void;
  onViewSummary: () => void;
  onMakePayment: () => void;
  onConfirmPayment: () => void;
  onAcceptOffer: () => void;
  onEditPrice: () => void;
}

export const EnhancedBookingCard: React.FC<EnhancedBookingCardProps> = ({
  booking,
  userType,
  onMessage,
  onViewSummary,
  onMakePayment,
  onConfirmPayment,
  onAcceptOffer,
  onEditPrice
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

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Booking #{booking.id?.slice(-6)}
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
            <span className="text-muted-foreground">Time:</span>
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

        {/* Price Information */}
        {(booking.estimated_price || booking.final_price) && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price:</span>
              <span className="font-medium">
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
            onClick={onMessage}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
          
          {booking.status === 'pending' && userType === 'passenger' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMakePayment}
              className="flex items-center gap-1"
            >
              <CreditCard className="h-4 w-4" />
              Pay
            </Button>
          )}

          {booking.status === 'confirmed' && userType === 'driver' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfirmPayment}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Confirm
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={onViewSummary}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
