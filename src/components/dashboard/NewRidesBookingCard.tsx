
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Phone } from 'lucide-react';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";

interface NewRidesBookingCardProps {
  booking: any;
  onClick?: () => void;
  className?: string;
  onMessage?: (booking: any) => void;
  onViewSummary?: (booking: any) => void;
}

export const NewRidesBookingCard = ({ 
  booking, 
  onClick,
  className = "",
  onMessage,
  onViewSummary
}: NewRidesBookingCardProps) => {
  if (!booking) return null;

  const passenger = booking.passengers;
  const driver = booking.drivers;

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
              <AvatarImage src={passenger?.profile_photo_url} />
              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                {passenger?.full_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {passenger?.full_name || 'Passenger'}
              </h3>
              <p className="text-sm text-gray-600">Your Passenger</p>
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
          </div>
        </div>

        {/* Status Timeline */}
        <StatusTimeline
          bookingId={booking.id}
          userType="driver"
          userPhotoUrl={driver?.profile_photo_url}
          otherUserPhotoUrl={passenger?.profile_photo_url}
          className="w-full mb-4"
        />

        {/* Action buttons */}
        <div className="flex space-x-2 pt-3 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.(booking);
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Phone className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewSummary?.(booking);
            }}
          >
            View Details
          </Button>
        </div>

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
