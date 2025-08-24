
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Star, MessageSquare, CreditCard, Calendar } from 'lucide-react';
import { useMyBookings } from '@/hooks/useMyBookings';
import { useReviewNotifications } from '@/hooks/useReviewNotifications';
import { AirbnbStyleReviewModal } from '@/components/review/AirbnbStyleReviewModal';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import type { Booking } from '@/lib/types/booking';

export const PassengerBookingsList = () => {
  const { bookings, loading, error, refetch } = useMyBookings();
  const { notifications, loading: notificationsLoading } = useReviewNotifications();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'awaiting_payment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offer_sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'paid':
      case 'all_set':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (booking: Booking) => {
    const status = booking.payment_confirmation_status?.toLowerCase();
    
    if (status === 'all_set') return 'All Set';
    if (status === 'passenger_paid') return 'Payment Confirmed';
    if (status === 'waiting_for_payment' || booking.ride_status === 'offer_sent') return 'Awaiting Payment';
    if (status === 'waiting_for_offer') return 'Processing Request';
    return 'Pending';
  };

  const canPayNow = (booking: Booking) => {
    const status = booking.payment_confirmation_status?.toLowerCase();
    return status === 'waiting_for_payment' || booking.ride_status === 'offer_sent';
  };

  const canLeaveReview = (booking: Booking) => {
    const status = booking.payment_confirmation_status?.toLowerCase();
    const hasReviewNotification = notifications.some(n => 
      n.booking_id === booking.id && !n.review_submitted
    );
    return status === 'all_set' && hasReviewNotification;
  };

  const handlePayNow = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handleLeaveReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowReviewModal(true);
  };

  const handlePaymentConfirmed = () => {
    setShowPaymentModal(false);
    setSelectedBooking(null);
    refetch();
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setSelectedBooking(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={refetch} className="mt-4">Try Again</Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-500">Your ride history will appear here after booking rides.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  #{(booking.booking_code || booking.id.slice(-8)).toUpperCase()}
                </span>
                <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.payment_confirmation_status)}`}>
                  {getStatusLabel(booking)}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-semibold text-gray-900">
                  ${booking.final_price || booking.estimated_price || '0.00'}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {booking.pickup_location}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {booking.dropoff_location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>
            </div>

            {booking.driver_name && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Driver: {booking.driver_name}
                  </p>
                  {booking.vehicle_type && (
                    <p className="text-xs text-gray-600">
                      {booking.vehicle_type}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {canPayNow(booking) && (
                <Button 
                  onClick={() => handlePayNow(booking)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              )}
              
              {canLeaveReview(booking) && (
                <Button 
                  onClick={() => handleLeaveReview(booking)}
                  variant="outline"
                  className="flex-1"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Leave Review
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm"
                className="px-3"
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedBooking && (
        <>
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedBooking(null);
            }}
            booking={selectedBooking}
            onPaymentConfirmed={handlePaymentConfirmed}
          />

          <AirbnbStyleReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              setSelectedBooking(null);
            }}
            booking={selectedBooking}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </>
      )}
    </div>
  );
};
