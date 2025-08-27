
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, CreditCard, CheckCircle, Car, Phone } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { useToast } from '@/hooks/use-toast';

interface OfferBookingCardProps {
  booking: any;
  passengerInfo: any;
  onViewDetails?: () => void;
}

export const OfferBookingCard: React.FC<OfferBookingCardProps> = ({
  booking,
  passengerInfo,
  onViewDetails
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasShownOfferNotification, setHasShownOfferNotification] = useState(false);
  const { toast } = useToast();

  // CRITICAL FIX: Enhanced payment status detection
  const isPaymentCompleted = () => {
    // Check multiple payment indicators for comprehensive detection
    const hasPaymentStatus = booking.payment_status === 'paid';
    const hasConfirmationStatus = booking.payment_confirmation_status === 'all_set';
    const hasGeneralStatus = booking.status === 'payment_confirmed';
    const hasRideStatus = booking.ride_status === 'all_set';
    const hasPaidFields = booking.paid_at && booking.paid_amount_cents > 0;
    const hasStripeReference = booking.stripe_payment_intent_id && booking.payment_reference;
    
    const isCompleted = hasPaymentStatus || hasConfirmationStatus || hasGeneralStatus || 
                       hasRideStatus || hasPaidFields || hasStripeReference;
    
    if (isCompleted) {
      console.log('💳 Payment completion detected:', {
        booking_id: booking.id,
        payment_status: booking.payment_status,
        confirmation_status: booking.payment_confirmation_status,
        paid_at: booking.paid_at,
        paid_amount: booking.paid_amount_cents
      });
    }
    
    return isCompleted;
  };

  const isOfferPending = () => {
    return !isPaymentCompleted() && (
      booking.status === 'offer_sent' || 
      booking.ride_status === 'offer_sent' ||
      booking.payment_confirmation_status === 'price_awaiting_acceptance'
    );
  };

  // Auto-show payment modal when offer is received
  useEffect(() => {
    // CRITICAL FIX: Only show payment modal if payment is actually needed
    const shouldShowPaymentModal = isOfferPending() && !hasShownOfferNotification;

    if (shouldShowPaymentModal) {
      console.log('🎯 Auto-showing payment modal for offer:', booking.id);
      setShowPaymentModal(true);
      setHasShownOfferNotification(true);
      
      // Show friendly notification
      toast({
        title: "Payment Ready",
        description: "Complete your payment to confirm your ride booking.",
      });
    }
    
    // CRITICAL FIX: Reset notification flag when payment is completed
    if (isPaymentCompleted() && hasShownOfferNotification) {
      setHasShownOfferNotification(false);
      setShowPaymentModal(false);
    }
  }, [booking.status, booking.ride_status, booking.payment_confirmation_status, booking.payment_status, booking.paid_at, hasShownOfferNotification]);

  const getStatusDisplay = () => {
    // CRITICAL FIX: Enhanced status detection with multiple payment indicators
    if (isPaymentCompleted()) {
      return { text: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200' };
    }
    
    if (isOfferPending()) {
      return { text: 'Offer Received', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    
    if (
      booking.payment_confirmation_status === 'waiting_for_payment' ||
      booking.payment_confirmation_status === 'passenger_paid' ||
      booking.payment_status === 'processing'
    ) {
      return { text: 'Payment Processing', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    
    if (booking.status === 'completed') {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
    
    return { text: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  // Use offer_price_cents as the single source of truth
  const getFormattedPrice = () => {
    // CRITICAL FIX: Use paid_amount_cents if payment is completed
    if (isPaymentCompleted() && booking.paid_amount_cents > 0) {
      return (booking.paid_amount_cents / 100).toFixed(2);
    }
    
    if (booking.offer_price_cents && booking.offer_price_cents > 0) {
      return (booking.offer_price_cents / 100).toFixed(2);
    }
    // Fallback to other price fields if offer_price_cents is not available
    if (booking.final_price_cents && booking.final_price_cents > 0) {
      return (booking.final_price_cents / 100).toFixed(2);
    }
    if (booking.estimated_price_cents && booking.estimated_price_cents > 0) {
      return (booking.estimated_price_cents / 100).toFixed(2);
    }
    if (booking.final_price && booking.final_price > 0) {
      return booking.final_price.toFixed(2);
    }
    if (booking.estimated_price && booking.estimated_price > 0) {
      return booking.estimated_price.toFixed(2);
    }
    return null;
  };

  const formattedPrice = getFormattedPrice();
  const statusDisplay = getStatusDisplay();

  // CRITICAL FIX: Only show payment button if payment is actually needed
  const shouldShowPaymentButton = isOfferPending() && !isPaymentCompleted();

  const handlePaymentConfirmed = () => {
    setShowPaymentModal(false);
    toast({
      title: "Payment Processing",
      description: "Your payment is being processed. You'll receive confirmation shortly.",
    });
  };

  // Get driver information
  const driverInfo = booking.drivers || {};
  const driverName = driverInfo.full_name || 'Driver';
  const driverPhone = driverInfo.phone;
  const driverPhoto = driverInfo.profile_photo_url;

  return (
    <>
      <Card className="border border-gray-200 hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${statusDisplay.color} border font-medium`}>
                {statusDisplay.text}
              </Badge>
              {booking.booking_code && (
                <span className="text-sm text-gray-500">#{booking.booking_code}</span>
              )}
            </div>
            <div className="text-right">
              {formattedPrice ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">${formattedPrice}</p>
                  <p className="text-xs text-gray-500">Total Price</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-gray-900"> </p>
                  <p className="text-xs text-gray-500">Total Price</p>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* CRITICAL FIX: Show driver info only when payment is completed */}
          {booking.driver_id && isPaymentCompleted() && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={driverPhoto} alt={driverName} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {driverName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{driverName}</p>
                <p className="text-sm text-gray-600">Your assigned driver</p>
              </div>
              {driverPhone && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{driverPhone}</span>
                </div>
              )}
            </div>
          )}

          {/* Route Information */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Pickup</p>
                <p className="text-sm text-gray-600">{booking.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Drop-off</p>
                <p className="text-sm text-gray-600">{booking.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* Pickup Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
              <p className="text-xs text-gray-500">Date & Time</p>
            </div>
          </div>

          {/* Vehicle Information */}
          {booking.vehicle_type && (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-700">{booking.vehicle_type}</span>
            </div>
          )}

          {/* Payment Button for Offers */}
          {shouldShowPaymentButton && (
            <div className="pt-2 border-t border-gray-100">
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay to Confirm Ride
              </Button>
            </div>
          )}

          {/* Confirmed Status */}
          {/* CRITICAL FIX: Enhanced confirmation status display */}
          {isPaymentCompleted() && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Ride Confirmed!</p>
                <p className="text-xs text-green-600">
                  {booking.driver_id ? 'Your driver will contact you soon.' : 'Driver assignment in progress.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRITICAL FIX: Only show payment modal if payment is needed */}
      {showPaymentModal && !isPaymentCompleted() && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={booking}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
    </>
  );
};
