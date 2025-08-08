
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign } from 'lucide-react';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: any;
  userType: 'passenger' | 'driver';
  onClick?: () => void;
  className?: string;
  onMessage?: () => void;
  onReview?: () => void;
  onViewSummary?: () => void;
  onCancelSuccess?: () => void;
  onNavigate?: () => void;
}

export const BookingCard = ({ 
  booking, 
  userType, 
  onClick,
  className = "",
  onMessage,
  onReview,
  onViewSummary,
  onCancelSuccess,
  onNavigate
}: BookingCardProps) => {
  if (!booking) return null;

  const otherUser = userType === 'passenger' ? booking.drivers : booking.passengers;
  const currentUser = userType === 'passenger' ? booking.passengers : booking.drivers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'offer_sent': return 'bg-blue-100 text-blue-800';
      case 'offer_accepted': return 'bg-green-100 text-green-800';
      case 'payment_confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'all_set': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className={`w-full cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser?.profile_photo_url} />
              <AvatarFallback>
                {otherUser?.full_name?.charAt(0) || (userType === 'passenger' ? 'D' : 'P')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium text-gray-900">
                {otherUser?.full_name || 'User'}
              </h4>
              <p className="text-sm text-gray-500">
                {userType === 'passenger' ? 'Your Driver' : 'Passenger'}
              </p>
            </div>
          </div>
          
          <Badge className={getStatusColor(booking.ride_status || booking.status)}>
            {(booking.ride_status || booking.status || 'pending').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Trip info */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 line-clamp-1">
              {booking.pickup_location || 'Pickup location'}
            </p>
          </div>
          
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-gray-700 line-clamp-1">
              {booking.dropoff_location || 'Dropoff location'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {booking.pickup_datetime 
                    ? format(new Date(booking.pickup_datetime), 'MMM d, h:mm a')
                    : 'Time TBD'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{booking.passenger_count || 1}</span>
              </div>
            </div>
            
            {(booking.final_price || booking.estimated_price) && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  {booking.final_price || booking.estimated_price}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Status Timeline */}
        <StatusTimeline
          bookingId={booking.id}
          userType={userType}
          userPhotoUrl={currentUser?.profile_photo_url}
          otherUserPhotoUrl={otherUser?.profile_photo_url}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
};
