
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, CreditCard, MessageCircle, Phone, Mail, Info } from 'lucide-react';
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check URL for session_id and reconcile if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && !isPaid()) {
      console.log('🔄 Found session_id, attempting reconcile:', sessionId);
      
      fetch(`/api/stripe/reconcile?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          console.log('📊 Reconcile result:', data);
          if (data.paid) {
            // Remove session_id from URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
            
            // Force refresh booking data
            if (onStatusUpdate) {
              onStatusUpdate();
            }
          }
        })
        .catch(err => {
          console.error('❌ Reconcile error:', err);
        });
    }
  }, []);

  const getStatusBadge = () => {
    // Check all possible paid indicators
    const isPaidStatus = booking.status === 'paid' || 
                        booking.payment_status === 'paid' || 
                        booking.paid_at || 
                        booking.paid_amount_cents > 0;
    
    if (isPaidStatus) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold">PAID</Badge>;
    }
    
    const status = booking.payment_confirmation_status || booking.status;
    
    switch (status) {
      case 'waiting_for_offer':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Awaiting Offer</Badge>;
      case 'offer_sent':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animate-pulse">⚡ OFFER RECEIVED - PAYMENT REQUIRED</Badge>;
      case 'waiting_for_payment':
      case 'awaiting_payment':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">💳 Payment Required</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Processing Payment</Badge>;
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
    // If any paid indicator exists, no action needed
    const isPaidStatus = booking.status === 'paid' || 
                        booking.payment_status === 'paid' || 
                        booking.paid_at || 
                        booking.paid_amount_cents > 0;
    if (isPaidStatus) {
      return false;
    }
    
    const status = booking.payment_confirmation_status || booking.status;
    return status === 'offer_sent' || status === 'waiting_for_payment' || status === 'awaiting_payment';
  };

  const canLeaveReview = () => {
    return booking.payment_confirmation_status === 'completed' || booking.status === 'completed';
  };

  const isPaid = () => {
    return booking.status === 'paid' || 
           booking.payment_status === 'paid' || 
           booking.paid_at || 
           booking.paid_amount_cents > 0;
  };

  const formatPrice = (cents?: number) => {
    if (!cents) return 'TBD';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleContactDriver = (type: 'phone' | 'sms' | 'email') => {
    if (!booking.drivers) return;
    
    switch (type) {
      case 'phone':
        window.open(`tel:${booking.drivers.phone}`);
        break;
      case 'sms':
        window.open(`sms:${booking.drivers.phone}`);
        break;
      case 'email':
        window.open(`mailto:${booking.drivers.email}`);
        break;
    }
  };

  const handlePayment = async () => {
    if (isProcessingPayment) return;
    
    setIsProcessingPayment(true);
    
    try {
      console.log('💳 Initiating payment for booking:', booking.booking_code || booking.id);

      // Call our create-checkout-session API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_code: booking.booking_code || booking.id,
          currency: 'usd'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        console.log('✅ Redirecting to Stripe Checkout:', data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert(error instanceof Error ? error.message : 'Unable to start checkout. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRideDetails = () => {
    console.log('Showing ride details for:', booking.id);
    alert('Ride details feature coming soon!');
  };

  return (
    <>
      <Card className={`hover:shadow-md transition-all duration-200 ${needsAction() ? 'ring-2 ring-primary/20 shadow-lg' : ''} ${isPaid() ? 'ring-2 ring-green-500/30 bg-green-50/30' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                {booking.booking_code || `#VIP-${new Date(booking.created_at).getFullYear()}-${booking.id.slice(0, 3).toUpperCase()}`}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(new Date(booking.pickup_time), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              <div className="text-right">
                <p className="text-lg font-semibold">
                  {formatPrice(booking.paid_amount_cents || booking.offer_price_cents || booking.final_price_cents || booking.estimated_price_cents)}
                </p>
                <p className="text-xs text-gray-500">Total Price</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Driver Info - Show full details when paid */}
          {isPaid() && booking.drivers ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
                {booking.drivers.profile_photo_url ? (
                  <img 
                    src={booking.drivers.profile_photo_url} 
                    alt={booking.drivers.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-semibold text-lg">
                    {booking.drivers.full_name?.charAt(0) || 'D'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">✅ Your Driver</p>
                <p className="font-semibold text-gray-900">{booking.drivers.full_name}</p>
                <div className="flex gap-3 mt-1">
                  <button 
                    onClick={() => handleContactDriver('phone')}
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {booking.drivers.phone}
                  </button>
                  <button 
                    onClick={() => handleContactDriver('sms')}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Text
                  </button>
                  {booking.drivers.email && (
                    <button 
                      onClick={() => handleContactDriver('email')}
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Email
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">D</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Driver</p>
                <p className="text-gray-500">
                  {isPaid() ? 'Driver details will be shared soon' : 'Awaiting assignment'}
                </p>
              </div>
            </div>
          )}

          {/* Route */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.pickup_location}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Drop-off</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {booking.dropoff_location}
                </p>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Date & Time</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>
          </div>

          {/* Vehicle Type */}
          {booking.vehicle_type && (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 text-purple-600">🚗</div>
              <div>
                <p className="text-sm font-medium text-gray-900">{booking.vehicle_type}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {/* If paid, show ride details button */}
            {isPaid() ? (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3" 
                onClick={handleRideDetails}
              >
                <Info className="h-4 w-4 mr-2" />
                Ride Details
              </Button>
            ) : needsAction() && !isProcessingPayment ? (
              /* If needs payment, show payment button */
              <Button 
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-3" 
                onClick={handlePayment}
                disabled={isProcessingPayment}
              >
                💳 Pay to Confirm Ride
              </Button>
            ) : isProcessingPayment ? (
              /* If processing payment */
              <Button 
                className="flex-1 bg-gray-400 text-white font-medium py-3" 
                disabled
              >
                Processing...
              </Button>
            ) : (
              /* Default state for other cases */
              <Button 
                className="flex-1 bg-gray-300 text-gray-600 font-medium py-3" 
                disabled
              >
                Waiting for Offer
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

          {/* Urgency Message - only show if payment is actually needed */}
          {needsAction() && !isProcessingPayment && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-3">
              <p className="text-sm text-primary font-medium">
                ⏰ Action needed: Complete payment to confirm your ride
              </p>
            </div>
          )}

          {/* Payment Success Message */}
          {isPaid() && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
              <p className="text-sm text-green-800 font-medium">
                ✅ Payment confirmed! Your ride is all set. Driver details above.
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
