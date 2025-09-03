
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, CreditCard, CheckCircle, Car, Phone, Receipt } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { ReceiptModal } from '@/components/passenger/ReceiptModal';
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
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [hasShownOfferNotification, setHasShownOfferNotification] = useState(false);
  const { toast } = useToast();

  // CRITICAL FIX: Enhanced payment status detection
  const isPaymentCompleted = () => {
    // Simplified and reliable payment detection based on the fixed webhook
    const hasPaymentStatus = booking.payment_status === 'paid';
    const hasStatusConfirmed = booking.status === 'payment_confirmed';
    const hasPaidFields = booking.paid_at && booking.paid_amount_cents > 0;
    const hasStripeReference = booking.stripe_payment_intent_id;
    
    const isCompleted = hasPaymentStatus || hasStatusConfirmed || hasPaidFields || hasStripeReference;
    
    if (isCompleted) {
      console.log('💳 Payment completion detected:', {
        booking_id: booking.id,
        booking_code: booking.booking_code,
        payment_status: booking.payment_status,
        status: booking.status,
        paid_at: booking.paid_at,
        paid_amount: booking.paid_amount_cents,
        stripe_reference: booking.stripe_payment_intent_id
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

  // Auto-show payment modal when offer is received (only if not already paid)
  useEffect(() => {
    // Only show payment modal if payment is needed and not already completed
    const shouldShowPaymentModal = isOfferPending() && !hasShownOfferNotification && !isPaymentCompleted();

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
      
      // Show payment success notification
      toast({
        title: "Payment Successful!",
        description: "Your ride has been confirmed. Driver details are now available.",
      });
    }
  }, [
    booking.status, 
    booking.ride_status, 
    booking.payment_confirmation_status, 
    booking.payment_status, 
    booking.paid_at,
    booking.paid_amount_cents,
    booking.stripe_payment_intent_id,
    hasShownOfferNotification, 
    toast
  ]);

  const getStatusDisplay = () => {
    // CRITICAL FIX: Enhanced status detection with multiple payment indicators
    if (isPaymentCompleted()) {
      return { text: 'PAID', color: 'bg-green-100 text-green-800 border-green-200' };
    }
    
    if (isOfferPending()) {
      return { text: 'OFFER RECEIVED', color: 'bg-blue-100 text-blue-800 border-blue-200' };
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
    setHasShownOfferNotification(false);
    toast({
      title: "Payment Successful!",
      description: "Your ride has been confirmed successfully.",
    });
  };

  // Get driver information from the nested drivers object
  const driverName = booking.drivers?.full_name || 'Driver';
  const driverPhone = booking.drivers?.phone;
  const driverPhoto = booking.drivers?.profile_photo_url || booking.drivers?.avatar_url;
  const driverEmail = booking.drivers?.email;
  const driverVehicle = booking.drivers ? 
    `${booking.drivers.car_make || ''} ${booking.drivers.car_model || ''}`.trim() || booking.vehicle_type :
    booking.vehicle_type;

  return (
    <Card className="p-6 mb-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <Badge 
            className={`${statusDisplay.color} px-3 py-1 font-semibold rounded-full`}
          >
            {statusDisplay.text}
          </Badge>
          {booking.booking_code && (
            <span className="text-sm text-muted-foreground font-medium">
              #{booking.booking_code}
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            ${formattedPrice || '0.00'}
          </div>
          <div className="text-sm text-muted-foreground">Total Price</div>
        </div>
      </div>

      {/* Driver Info - Only show after payment */}
      {isPaymentCompleted() && booking.driver_id && (
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12">
            {driverPhoto ? (
              <AvatarImage src={driverPhoto} alt={driverName || 'Driver'} />
            ) : (
              <AvatarFallback className="bg-gray-200 text-gray-600 text-lg font-semibold">
                {driverName ? driverName.split(' ').map(n => n[0]).join('').toUpperCase() : 'DR'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-foreground text-lg">
              {driverName || 'Driver'}
            </div>
            <div className="text-sm text-muted-foreground">
              {driverPhone ? (
                <a 
                  href={`tel:${driverPhone}`} 
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  {driverPhone}
                </a>
              ) : (
                'Phone not available'
              )}
            </div>
            {driverEmail && (
              <div className="text-sm text-muted-foreground">
                <a 
                  href={`mailto:${driverEmail}`}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  {driverEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Pickup</div>
            <div className="text-sm text-muted-foreground break-words">
              {booking.pickup_location}
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Drop-off</div>
            <div className="text-sm text-muted-foreground break-words">
              {booking.dropoff_location}
            </div>
          </div>
        </div>
      </div>

      {/* Date and Time */}
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-4 w-4 text-blue-600" />
        <div>
          <div className="text-sm font-medium text-foreground">
            {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
          </div>
          <div className="text-xs text-muted-foreground">Date & Time</div>
        </div>
      </div>

      {/* Vehicle Type */}
      {booking.vehicle_type && (
        <div className="flex items-center gap-3 mb-4">
          <Car className="h-4 w-4 text-purple-600" />
          <div className="text-sm font-medium text-foreground">
            {booking.vehicle_type}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        {shouldShowPaymentButton && (
          <Button 
            onClick={() => setShowPaymentModal(true)}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay Now
          </Button>
        )}
        
        {isPaymentCompleted() && (
          <Button 
            variant="outline" 
            onClick={() => setShowReceiptModal(true)}
            className="flex-1"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Receipt
          </Button>
        )}
      </div>

      {/* Confirmation Message */}
      {isPaymentCompleted() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-semibold text-green-800">Ride Confirmed!</div>
              <div className="text-sm text-green-700">
                Your driver will contact you soon.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={booking}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}

      {showReceiptModal && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          booking={booking}
        />
      )}
    </Card>
  );
};
