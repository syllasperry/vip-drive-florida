import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, MessageCircle, User, Eye } from "lucide-react";
import { MessagingInterface } from "@/components/MessagingInterface";
import { RideDetailsModal } from "@/components/timeline/RideDetailsModal";

interface DriverHistorySectionProps {
  bookings: any[];
  currentDriverId: string;
  currentDriverName: string;
  currentDriverAvatar?: string;
  onMessage?: (booking: any) => void;
  onCall?: (booking: any) => void;
}

export const DriverHistorySection = ({ 
  bookings, 
  currentDriverId, 
  currentDriverName, 
  currentDriverAvatar,
  onMessage,
  onCall
}: DriverHistorySectionProps) => {
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState<any>(null);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any>(null);

  const handleMessage = (booking: any) => {
    if (onMessage) {
      onMessage(booking);
    } else {
      setSelectedBookingForMessage(booking);
    }
  };

  const handleCall = (booking: any) => {
    if (onCall) {
      onCall(booking);
    } else {
      const passengerPhone = booking.passengers?.phone || booking.passenger?.phone;
      if (passengerPhone) {
        const cleanPhone = passengerPhone.replace(/[^\d]/g, '');
        window.location.href = `tel:+1${cleanPhone}`;
      }
    }
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBookingForDetails(booking);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
      case 'declined':
        return 'destructive';
      case 'confirmed':
      case 'accepted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return 'Date TBD';
    
    const date = new Date(dateString + (timeString ? ` ${timeString}` : ''));
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: timeString ? '2-digit' : undefined,
      minute: timeString ? '2-digit' : undefined
    });
  };

  if (!bookings || bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ride History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No ride history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ride History ({bookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bookings.map((booking) => {
            const passengerInfo = booking.passengers || booking.passenger;
            
            return (
              <div
                key={booking.id}
                className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                {/* Header with Status and Date */}
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusBadgeVariant(booking.status)}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Unknown'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDateTime(booking.date, booking.time)}
                  </span>
                </div>

                {/* Passenger Info */}
                {passengerInfo && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">
                        {passengerInfo.full_name || 'Passenger'}
                      </p>
                      {passengerInfo.phone && (
                        <p className="text-xs text-muted-foreground">
                          {passengerInfo.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Route Information */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {booking.pickup_location || 'Pickup location not specified'}
                      </p>
                      <p className="text-xs text-muted-foreground">Pickup</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="h-4 w-4 flex items-center justify-center mt-0.5">
                      <div className="h-2 w-2 bg-red-600 rounded-full"></div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {booking.dropoff_location || 'Drop-off location not specified'}
                      </p>
                      <p className="text-xs text-muted-foreground">Drop-off</p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                {(booking.final_price || booking.estimated_price) && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      ${booking.final_price || booking.estimated_price} USD
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMessage(booking)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                  
                  {passengerInfo?.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall(booking)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(booking)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Messaging Interface - only show if not using parent handlers */}
      {!onMessage && selectedBookingForMessage && (
        <MessagingInterface
          isOpen={!!selectedBookingForMessage}
          onClose={() => setSelectedBookingForMessage(null)}
          userType="driver"
          bookingId={selectedBookingForMessage.id}
          currentUserId={currentDriverId}
          currentUserName={currentDriverName}
          currentUserAvatar={currentDriverAvatar}
          otherUserName={selectedBookingForMessage.passengers?.full_name || selectedBookingForMessage.passenger?.full_name}
          otherUserAvatar={selectedBookingForMessage.passengers?.profile_photo_url || selectedBookingForMessage.passenger?.profile_photo_url}
        />
      )}

      {/* Ride Details Modal */}
      {selectedBookingForDetails && (
        <RideDetailsModal
          isOpen={!!selectedBookingForDetails}
          onClose={() => setSelectedBookingForDetails(null)}
          booking={selectedBookingForDetails}
        />
      )}
    </>
  );
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'confirmed':
      return 'secondary';
    default:
      return 'outline';
  }
};

const formatDateTime = (dateString: string, timeString?: string) => {
  if (!dateString) return 'Date TBD';
  
  const date = new Date(dateString + (timeString ? ` ${timeString}` : ''));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: timeString ? '2-digit' : undefined,
    minute: timeString ? '2-digit' : undefined
  });
};
