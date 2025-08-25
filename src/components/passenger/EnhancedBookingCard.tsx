
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Car, Clock, Eye } from 'lucide-react';
import { PassengerAvatar } from './PassengerAvatar';
import { format } from 'date-fns';

interface BookingData {
  id: string;
  booking_code?: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type?: string;
  final_price?: number;
  estimated_price?: number;
  status: string;
  payment_confirmation_status?: string;
  ride_status?: string;
  passenger_first_name?: string;
  passenger_last_name?: string;
  passenger_photo_url?: string;
  passengers?: {
    full_name: string;
    profile_photo_url?: string;
  };
}

interface EnhancedBookingCardProps {
  booking: BookingData;
  onViewDetails?: () => void;
}

export const EnhancedBookingCard: React.FC<EnhancedBookingCardProps> = ({
  booking,
  onViewDetails
}) => {
  const getStatusBadge = () => {
    const status = booking.payment_confirmation_status || booking.ride_status || booking.status;
    
    switch (status) {
      case 'waiting_for_offer':
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'offer_sent':
      case 'waiting_for_payment':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Paid</Badge>;
      case 'passenger_paid':
      case 'payment_confirmed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">All Set</Badge>;
      case 'all_set':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">All Set</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pending</Badge>;
    }
  };

  const getStatusMessage = () => {
    const status = booking.payment_confirmation_status || booking.ride_status || booking.status;
    
    switch (status) {
      case 'waiting_for_offer':
      case 'pending':
        return 'Awaiting driver assignment';
      case 'passenger_paid':
      case 'payment_confirmed':
        return 'Payment confirmed';
      case 'all_set':
        return 'All set for your ride';
      default:
        return null;
    }
  };

  const passengerName = booking.passengers?.full_name || 
    (booking.passenger_first_name && booking.passenger_last_name 
      ? `${booking.passenger_first_name} ${booking.passenger_last_name}` 
      : 'Passenger');

  const passengerPhoto = booking.passengers?.profile_photo_url || booking.passenger_photo_url;

  const price = booking.final_price || booking.estimated_price;

  return (
    <Card className="w-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header with passenger info and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <PassengerAvatar 
              src={passengerPhoto}
              name={passengerName}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {booking.booking_code || `VIP-${booking.id.slice(-6)}`}
              </h3>
              <p className="text-sm text-gray-500">
                {booking.pickup_location.length > 20 
                  ? `${booking.pickup_location.slice(0, 20)}...` 
                  : booking.pickup_location}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Route information */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-green-500" />
            <span className="truncate">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-red-500" />
            <span className="truncate">{booking.dropoff_location}</span>
          </div>
        </div>

        {/* Vehicle and price info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Car className="h-4 w-4" />
            <span>{booking.vehicle_type || 'Standard Vehicle'}</span>
          </div>
          {price && (
            <div className="text-lg font-semibold text-gray-900">
              ${price}
            </div>
          )}
        </div>

        {/* SmartPrice indicator */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">SmartPrice ON</span>
          <Button 
            variant="link" 
            className="text-[#00A699] hover:text-[#008A80] p-0 h-auto font-medium"
            onClick={onViewDetails}
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
        </div>

        {/* Status message */}
        {getStatusMessage() && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium">{getStatusMessage()}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
