
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, Users, Car, Phone, MessageCircle, DollarSign, Calendar } from 'lucide-react';
import { ComprehensiveStatusTimeline } from '@/components/timeline/ComprehensiveStatusTimeline';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { BookingChatModal } from '@/components/chat/BookingChatModal';

interface UniversalRideCardProps {
  booking: any;
  userType: 'passenger' | 'driver' | 'dispatcher';
  onAction?: (action: string) => void;
  className?: string;
  onMessage?: () => void;
  onViewSummary?: () => void;
  onStatusUpdate?: () => void;
}

export const UniversalRideCard = ({ 
  booking, 
  userType, 
  onAction,
  className = "",
  onMessage,
  onViewSummary,
  onStatusUpdate
}: UniversalRideCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  if (!booking) return null;

  const otherUser = userType === 'passenger' ? booking.drivers : booking.passengers;
  const currentUser = userType === 'passenger' ? booking.passengers : booking.drivers;

  const formatDateTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, h:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = () => {
    const status = booking.ride_status || booking.status;
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'offer_sent': return 'bg-blue-100 text-blue-800';
      case 'offer_accepted': return 'bg-green-100 text-green-800';
      case 'payment_confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'all_set': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle phone call action
  const handleCallDriver = () => {
    if (userType === 'passenger' && otherUser?.phone) {
      window.location.href = `tel:${otherUser.phone}`;
    } else {
      toast({
        title: "Phone Number Not Available",
        description: "Driver's phone number is not available.",
        variant: "destructive"
      });
    }
  };

  // Handle message action
  const handleMessageDriver = () => {
    if (onMessage) {
      onMessage();
    } else {
      setShowChat(true);
    }
  };

  // Prepare participant data for timeline
  const passengerData = {
    name: booking.passengers?.full_name || 'Passenger',
    photo_url: booking.passengers?.profile_photo_url
  };

  const driverData = {
    name: booking.drivers?.full_name || 'Driver',
    photo_url: booking.drivers?.profile_photo_url
  };

  return (
    <>
      <Card className={`w-full mb-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
        <CardContent className="p-4">
          {/* Header with user info and status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.profile_photo_url} />
                <AvatarFallback>
                  {otherUser?.full_name?.charAt(0) || (userType === 'passenger' ? 'D' : 'P')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {otherUser?.full_name || 'User'}
                </h3>
                <p className="text-sm text-gray-600">
                  {userType === 'passenger' ? 'Driver' : userType === 'dispatcher' ? 'Passenger' : 'Passenger'}
                </p>
              </div>
            </div>
            
            <Badge className={getStatusBadgeColor()}>
              {booking.ride_status?.replace('_', ' ').toUpperCase() || 'PENDING'}
            </Badge>
          </div>

          {/* Trip details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Pickup</p>
                <p className="text-sm text-gray-600 break-words">
                  {booking.pickup_location || 'Location not set'}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Drop-off</p>
                <p className="text-sm text-gray-600 break-words">
                  {booking.dropoff_location || 'Location not set'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDateTime(booking.pickup_datetime || booking.created_at)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{booking.passenger_count || 1} passenger{booking.passenger_count > 1 ? 's' : ''}</span>
              </div>
              
              {booking.vehicle_type && (
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-500" />
                  <span>{booking.vehicle_type}</span>
                </div>
              )}
              
              {(booking.final_price || booking.estimated_price) && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    ${booking.final_price || booking.estimated_price}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Comprehensive Status Timeline */}
          <div className="mb-4">
            <ComprehensiveStatusTimeline
              bookingId={booking.id}
              userType={userType}
              passengerData={passengerData}
              driverData={driverData}
              finalPrice={booking.final_price || booking.estimated_price}
              className="w-full"
            />
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleMessageDriver}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            
            {userType === 'passenger' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCallDriver}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </Button>
          </div>

          {/* Additional details when expanded */}
          {showDetails && (
            <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
              <div><strong>Booking ID:</strong> {booking.id}</div>
              <div><strong>Created:</strong> {formatDateTime(booking.created_at)}</div>
              {booking.special_requests && (
                <div><strong>Special Requests:</strong> {booking.special_requests}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Modal */}
      <BookingChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        bookingId={booking.id}
        role={userType === 'dispatcher' ? 'dispatcher' : 'passenger'}
      />
    </>
  );
};
