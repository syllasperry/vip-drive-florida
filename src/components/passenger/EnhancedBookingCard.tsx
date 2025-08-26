
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Eye, Phone } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface BookingInfo {
  id: string;
  booking_code?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  status: string;
  final_price?: number;
  estimated_price?: number;
  vehicle_type?: string;
  driver_id?: string;
  payment_confirmation_status?: string;
  ride_status?: string;
}

interface PassengerInfo {
  id: string;
  full_name?: string;
  profile_photo_url?: string;
  phone?: string;
  email?: string;
}

interface EnhancedBookingCardProps {
  booking: BookingInfo;
  passengerInfo?: PassengerInfo;
  onViewDetails: () => void;
}

export const EnhancedBookingCard: React.FC<EnhancedBookingCardProps> = ({
  booking,
  passengerInfo,
  onViewDetails
}) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'all_set':
        return 'default';
      case 'pending':
      case 'waiting_for_offer':
        return 'secondary';
      case 'offer_sent':
      case 'price_awaiting_acceptance':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusMessage = () => {
    if (!booking.driver_id) {
      return 'Awaiting driver assignment';
    }
    
    switch (booking.payment_confirmation_status) {
      case 'waiting_for_offer':
        return 'Waiting for driver offer';
      case 'price_awaiting_acceptance':
        return 'Review received offer';
      case 'passenger_paid':
        return 'Payment confirmed, awaiting driver';
      case 'all_set':
        return 'All set for your trip';
      default:
        return 'Processing booking';
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getPassengerInitials = () => {
    if (!passengerInfo?.full_name) return 'P';
    return passengerInfo.full_name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const { date, time } = formatDateTime(booking.pickup_time);
  const displayPrice = formatPrice(booking.final_price || booking.estimated_price);
  const statusMessage = getStatusMessage();

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with Passenger Info and Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                <AvatarImage 
                  src={passengerInfo?.profile_photo_url || undefined} 
                  alt={passengerInfo?.full_name || 'Passenger'}
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#FF385C] text-white font-semibold">
                  {getPassengerInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-gray-900">
                  {passengerInfo?.full_name || 'Passenger'}
                </h3>
                <p className="text-sm text-gray-500">
                  {booking.booking_code ? `#${booking.booking_code}` : `Booking ${booking.id.slice(-6).toUpperCase()}`}
                </p>
              </div>
            </div>

            <Badge variant={getStatusVariant(booking.status)}>
              {booking.status}
            </Badge>
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              {statusMessage}
            </p>
          </div>

          {/* Trip Details */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.pickup_location}
                </p>
                <p className="text-xs text-gray-500">Pickup</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.dropoff_location}
                </p>
                <p className="text-xs text-gray-500">Drop-off</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {date} at {time}
                </p>
                <p className="text-xs text-gray-500">Date & Time</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {booking.vehicle_type && (
                <span className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{booking.vehicle_type}</span>
                </span>
              )}
              {passengerInfo?.phone && (
                <span className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{passengerInfo.phone}</span>
                </span>
              )}
            </div>

            {displayPrice && (
              <div className="text-right">
                <p className="text-lg font-bold text-[#FF385C]">
                  {displayPrice}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={onViewDetails}
            variant="outline" 
            className="w-full border-[#FF385C] text-[#FF385C] hover:bg-[#FF385C] hover:text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
