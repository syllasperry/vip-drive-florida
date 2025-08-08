
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, MessageCircle, FileText, User } from "lucide-react";
import { useState } from "react";
import { MessagingInterface } from "@/components/MessagingInterface";
import { BookingSummaryModal } from "@/components/BookingSummaryModal";
import { format } from "date-fns";

interface DriverRideHistoryCardProps {
  booking: any;
  currentDriverId: string;
  currentDriverName: string;
  currentDriverAvatar?: string;
}

export const DriverRideHistoryCard = ({ 
  booking, 
  currentDriverId,
  currentDriverName,
  currentDriverAvatar
}: DriverRideHistoryCardProps) => {
  const [showMessaging, setShowMessaging] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handlePhoneCall = () => {
    const passengerPhone = booking.passengers?.phone || booking.passenger_phone;
    if (passengerPhone) {
      const cleanPhone = passengerPhone.replace(/[^\d]/g, '');
      window.location.href = `tel:+1${cleanPhone}`;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM d, h:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = () => {
    const status = booking.ride_status || booking.status;
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'all_set': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const passengerInfo = booking.passengers || booking.passenger;

  return (
    <>
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header with passenger info and status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={passengerInfo?.profile_photo_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {passengerInfo?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'P'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {passengerInfo?.full_name || 'Passenger Name'}
                </h3>
                <p className="text-sm text-gray-600">Passenger</p>
              </div>
            </div>
            
            <Badge className={getStatusBadgeColor()}>
              {(booking.ride_status || booking.status)?.replace('_', ' ').toUpperCase() || 'COMPLETED'}
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
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatDateTime(booking.pickup_time || booking.created_at)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{booking.passenger_count || 1} passenger{booking.passenger_count > 1 ? 's' : ''}</span>
              </div>
            </div>

            {(booking.final_price || booking.estimated_price) && (
              <div className="text-right">
                <p className="text-lg font-bold text-primary">
                  ${booking.final_price || booking.estimated_price} USD
                </p>
              </div>
            )}
          </div>

          {/* Action buttons - Same as Passenger Dashboard */}
          <div className="flex space-x-2 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowMessaging(true)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePhoneCall}
              disabled={!passengerInfo?.phone && !booking.passenger_phone}
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => setShowSummary(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Interface */}
      <MessagingInterface
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
        userType="driver"
        bookingId={booking.id}
        currentUserId={currentDriverId}
        currentUserName={currentDriverName}
        currentUserAvatar={currentDriverAvatar}
        otherUserName={passengerInfo?.full_name}
        otherUserAvatar={passengerInfo?.profile_photo_url}
      />

      {/* Booking Summary Modal */}
      <BookingSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        booking={booking}
        userType="driver"
      />
    </>
  );
};
