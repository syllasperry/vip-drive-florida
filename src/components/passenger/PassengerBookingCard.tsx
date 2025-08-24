
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, CreditCard, MessageCircle } from 'lucide-react';
import { AirbnbStyleReviewModal } from '@/components/review/AirbnbStyleReviewModal';
import { MessagingInterface } from '@/components/dashboard/MessagingInterface';
import { format } from 'date-fns';
import type { Booking } from '@/lib/types/booking';

interface PassengerBookingCardProps {
  booking: Booking;
  currentUserId: string;
  currentUserName: string;
  onStatusUpdate?: () => void;
}

export const PassengerBookingCard: React.FC<PassengerBookingCardProps> = ({
  booking,
  currentUserId,
  currentUserName,
  onStatusUpdate
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  const getStatusBadge = () => {
    const status = booking.payment_confirmation_status || booking.status;
    
    switch (status) {
      case 'waiting_for_offer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Awaiting Offer</Badge>;
      case 'offer_sent':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">Payment Required</Badge>;
      case 'waiting_for_payment':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">Payment Required</Badge>;
      case 'passenger_paid':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Payment Confirmed</Badge>;
      case 'all_set':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">All Set</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const needsAction = () => {
    const status = booking.payment_confirmation_status || booking.status;
    return status === 'offer_sent' || status === 'waiting_for_payment';
  };

  const canLeaveReview = () => {
    return booking.payment_confirmation_status === 'completed' || booking.status === 'completed';
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return 'TBD';
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <>
      <Card className={`hover:shadow-md transition-all duration-200 ${needsAction() ? 'ring-2 ring-primary/20 shadow-lg' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                {booking.booking_code || `Booking #${booking.id.slice(0, 8)}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(booking.pickup_time), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              {needsAction() && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.pickup_location}
                </p>
                <p className="text-xs text-gray-500">Pickup</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.dropoff_location}
                </p>
                <p className="text-xs text-gray-500">Destination</p>
              </div>
            </div>
          </div>

          {/* Driver & Price Info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Driver</p>
                <p className="text-sm font-medium">
                  {booking.driver_name || 'TBD'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-sm font-medium">
                  {formatPrice(booking.final_price_cents || booking.estimated_price_cents)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {needsAction() && (
              <Button 
                className="flex-1" 
                onClick={() => {
                  // Navigate to payment or booking details
                  window.location.href = `/passenger/dashboard?tab=bookings&booking=${booking.id}`;
                }}
              >
                {booking.payment_confirmation_status === 'offer_sent' || booking.status === 'offer_sent' 
                  ? 'Complete Payment' 
                  : 'View Details'
                }
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowMessaging(true)}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </Button>

            {canLeaveReview() && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowReviewModal(true)}
              >
                Review
              </Button>
            )}
          </div>

          {/* Urgency Message */}
          {needsAction() && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-3">
              <p className="text-sm text-primary font-medium">
                ⏰ Action needed: Complete payment to confirm your ride
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <AirbnbStyleReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        booking={booking}
        onReviewSubmitted={() => {
          setShowReviewModal(false);
          onStatusUpdate?.();
        }}
      />

      {/* Messaging Interface */}
      <MessagingInterface
        bookingId={booking.id}
        userType="passenger"
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </>
  );
};
