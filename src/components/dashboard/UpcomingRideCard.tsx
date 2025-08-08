
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, Car, DollarSign } from 'lucide-react';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { format } from 'date-fns';

interface UpcomingRideCardProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onClick?: () => void;
  className?: string;
}

export const UpcomingRideCard = ({ 
  booking, 
  userType, 
  onClick,
  className = "" 
}: UpcomingRideCardProps) => {
  if (!booking) return null;

  const otherUser = userType === 'passenger' ? booking.drivers : booking.passengers;
  const currentUser = userType === 'passenger' ? booking.passengers : booking.drivers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'all_set': return 'bg-emerald-500 text-white';
      case 'payment_confirmed': return 'bg-blue-500 text-white';
      case 'offer_accepted': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card 
      className={`w-full border-l-4 border-l-emerald-500 cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 border-2 border-emerald-200">
              <AvatarImage src={otherUser?.profile_photo_url} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {otherUser?.full_name?.charAt(0) || (userType === 'passenger' ? 'D' : 'P')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {otherUser?.full_name || 'User'}
              </h3>
              <p className="text-sm text-gray-600">
                {userType === 'passenger' ? 'Your Driver' : 'Your Passenger'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <Badge className={getStatusColor(booking.ride_status || booking.status)}>
              CONFIRMED
            </Badge>
            {(booking.final_price || booking.estimated_price) && (
              <p className="text-lg font-bold text-emerald-600 mt-1">
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
              <p className="text-sm text-gray-900 break-words">
                {booking.pickup_location || 'Pickup location'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">DROP-OFF</p>
              <p className="text-sm text-gray-900 break-words">
                {booking.dropoff_location || 'Drop-off location'}
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
                {booking.vehicle_type || 'Vehicle'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <StatusTimeline
          bookingId={booking.id}
          userType={userType}
          userPhotoUrl={currentUser?.profile_photo_url}
          otherUserPhotoUrl={otherUser?.profile_photo_url}
          className="w-full"
        />

        {/* Time until pickup */}
        <div className="mt-4 pt-3 border-t text-center">
          <p className="text-sm text-gray-600">
            Scheduled for {booking.pickup_datetime 
              ? format(new Date(booking.pickup_datetime), 'EEEE, MMM d \'at\' h:mm a')
              : 'Date and time TBD'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
