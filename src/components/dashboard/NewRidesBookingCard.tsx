
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, Car, DollarSign, Phone } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { format } from 'date-fns';

interface NewRidesBookingCardProps {
  booking: any;
  userType?: 'passenger' | 'driver';
  onAccept?: () => void;
  onDecline?: () => void;
  onClick?: () => void;
  className?: string;
}

export const NewRidesBookingCard = ({ 
  booking, 
  userType = 'driver',
  onAccept, 
  onDecline,
  onClick,
  className = "" 
}: NewRidesBookingCardProps) => {
  if (!booking) return null;

  const passenger = booking.passengers;
  const driver = booking.drivers;
  const otherUser = userType === 'passenger' ? driver : passenger;
  const currentUser = userType === 'passenger' ? passenger : driver;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'offer_sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'offer_accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'payment_confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'all_set': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isPending = booking.status === 'pending' || booking.ride_status === 'pending';
  const isNewRequest = !booking.driver_id || booking.ride_status === 'pending';

  return (
    <Card 
      className={`w-full border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage src={otherUser?.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                  {otherUser?.full_name?.charAt(0) || (userType === 'passenger' ? 'D' : 'P')}
                </AvatarFallback>
              </Avatar>
              {isNewRequest && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {otherUser?.full_name || 'New Passenger'}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {otherUser?.phone || 'Phone not provided'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <Badge className={`${getStatusColor(booking.ride_status || booking.status)} text-xs font-bold mb-1`}>
              {isNewRequest ? 'NEW REQUEST' : (booking.ride_status || booking.status || 'PENDING').replace('_', ' ').toUpperCase()}
            </Badge>
            {(booking.final_price || booking.estimated_price) && (
              <p className="text-lg font-bold text-green-600">
                ${booking.final_price || booking.estimated_price}
              </p>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">PICKUP</p>
              <p className="text-sm text-gray-900 font-medium break-words">
                {booking.pickup_location || 'Pickup location not set'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">DROP-OFF</p>
              <p className="text-sm text-gray-900 font-medium break-words">
                {booking.dropoff_location || 'Drop-off location not set'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium">
                {booking.pickup_datetime 
                  ? format(new Date(booking.pickup_datetime), 'h:mm a')
                  : 'Time TBD'
                }
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{booking.passenger_count || 1} pax</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Car className="h-4 w-4 text-green-600" />
              <span className="font-medium text-xs">
                {booking.vehicle_type || 'Any Vehicle'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mb-4">
          <StatusTimeline
            bookingId={booking.id}
            userType={userType}
            userPhotoUrl={currentUser?.profile_photo_url}
            otherUserPhotoUrl={otherUser?.profile_photo_url}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        {isPending && userType === 'driver' && (
          <div className="flex space-x-3 pt-3 border-t">
            <Button 
              onClick={onDecline}
              variant="outline" 
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
            >
              Decline
            </Button>
            <Button 
              onClick={onAccept}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Accept Ride
            </Button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          Pickup requested for {booking.pickup_datetime 
            ? format(new Date(booking.pickup_datetime), 'MMM d, yyyy \'at\' h:mm a')
            : format(new Date(booking.created_at), 'MMM d, yyyy \'at\' h:mm a')
          }
        </div>
      </CardContent>
    </Card>
  );
};
