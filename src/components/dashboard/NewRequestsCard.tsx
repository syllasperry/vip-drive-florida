
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, Car, Phone, DollarSign } from 'lucide-react';
import { StatusTimeline } from '@/components/timeline/StatusTimeline';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";

interface NewRequestsCardProps {
  booking: any;
  onClick?: () => void;
  className?: string;
  onAccept?: (booking: any) => void;
  onDecline?: (booking: any) => void;
  onMessage?: (booking: any) => void;
  onCall?: (booking: any) => void;
}

export const NewRequestsCard = ({ 
  booking, 
  onClick,
  className = "",
  onAccept,
  onDecline,
  onMessage,
  onCall
}: NewRequestsCardProps) => {
  if (!booking) return null;

  const passenger = booking.passengers;
  const driver = booking.drivers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border border-orange-300';
      case 'offer_sent': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'offer_accepted': return 'bg-green-100 text-green-800 border border-green-300';
      case 'payment_confirmed': return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
      case 'all_set': return 'bg-purple-100 text-purple-800 border border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Response';
      case 'offer_sent': return 'Offer Sent';
      case 'offer_accepted': return 'Offer Accepted';
      case 'payment_confirmed': return 'Payment Confirmed';
      case 'all_set': return 'All Set';
      default: return 'Pending Response';
    }
  };

  return (
    <Card 
      className={`w-full border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header with car icon and status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Car className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">New Ride Request</h2>
              <p className="text-sm text-gray-600">Ride booking request</p>
            </div>
          </div>
          
          <Badge className={getStatusColor(booking.ride_status || booking.status || 'pending')}>
            {getStatusText(booking.ride_status || booking.status || 'pending')}
          </Badge>
        </div>

        {/* Passenger info */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-12 w-12 border-2 border-blue-200">
            <AvatarImage src={passenger?.profile_photo_url} />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {passenger?.full_name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">
              {passenger?.full_name || 'Passenger'}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  {booking.pickup_datetime 
                    ? format(new Date(booking.pickup_datetime), 'h:mm a')
                    : '5:00 AM'
                  }
                </span>
              </div>
              {passenger?.phone_number && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    {passenger.phone_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">PICKUP</p>
              <p className="text-sm text-gray-900 break-words border-b border-dotted border-gray-300 pb-1">
                {booking.pickup_location || 'Pickup location'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="h-5 w-5 bg-red-500 rounded-full mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">DROP-OFF</p>
              <p className="text-sm text-gray-900 break-words">
                {booking.dropoff_location || 'Drop-off location'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{booking.passenger_count || 1} pax</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Car className="h-4 w-4 text-green-600" />
              <span className="font-medium">{booking.vehicle_type || 'Tesla Model Y'}</span>
            </div>
            
            {(booking.final_price || booking.estimated_price) && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-bold text-green-600">
                  {booking.final_price || booking.estimated_price || 'TBD'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visual Status Timeline */}
        <StatusTimeline
          bookingId={booking.id}
          userType="driver"
          userPhotoUrl={driver?.profile_photo_url}
          otherUserPhotoUrl={passenger?.profile_photo_url}
          className="w-full mb-4"
        />

        {/* Status message based on booking status */}
        {(booking.ride_status === 'offer_accepted' || booking.status === 'offer_accepted') && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-sm font-medium text-green-800">✓ Ride Accepted</p>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Waiting for passenger payment confirmation
            </p>
          </div>
        )}

        {/* Action buttons or ride info */}
        {booking.ride_status === 'pending' || booking.status === 'pending' ? (
          <div className="flex space-x-2 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onDecline?.(booking);
              }}
            >
              Decline
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.(booking);
              }}
            >
              Accept Ride
            </Button>
          </div>
        ) : (
          <div className="pt-3 border-t text-center">
            <p className="text-sm text-gray-600">
              Pickup requested for {booking.pickup_datetime 
                ? format(new Date(booking.pickup_datetime), 'MMM d, yyyy \'at\' h:mm a')
                : 'Aug 8, 2025 at 5:00 AM'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
