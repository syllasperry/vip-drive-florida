
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

  // Get driver information from embedded fields in bookings table
  const driverName = booking.driver_name || 'Driver';
  const driverPhone = booking.driver_phone;
  const driverPhoto = booking.driver_photo_url;
  const driverEmail = booking.driver_email;

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
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={driverPhoto} 
                  alt={driverName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-600 text-white text-lg font-semibold">
                  {driverName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-lg mb-1">{driverName}</p>
                {/* Vehicle Information */}
                {booking.vehicle_type && (
                  <p className="text-gray-600 mb-2">
                    {booking.vehicle_type}
                  </p>
                )}
                {/* Contact Information */}
                <div className="flex flex-col gap-2">
                  {driverPhone && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Create phone number without formatting for tel: protocol
                          const cleanPhone = driverPhone.replace(/\D/g, '');
                          window.location.href = `tel:+1${cleanPhone}`;
                        }}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call {driverPhone}</span>
                      </button>
                      <button
                        onClick={() => {
                          // Create SMS link
                          const cleanPhone = driverPhone.replace(/\D/g, '');
                          const message = `Hi ${driverName}, this is regarding VIP booking ${booking.booking_code || booking.id.slice(-8).toUpperCase()}. `;
                          window.location.href = `sms:+1${cleanPhone}?body=${encodeURIComponent(message)}`;
                        }}
                        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-800 hover:underline cursor-pointer bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>SMS</span>
                      </button>
                    </div>
                  )}
                  {driverEmail && (
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent(`VIP Ride - Booking ${booking.booking_code || booking.id.slice(-8).toUpperCase()}`);
                        const body = encodeURIComponent(`Hi ${driverName},\n\nThis is regarding my VIP booking scheduled for ${format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}.\n\nPickup: ${booking.pickup_location}\nDrop-off: ${booking.dropoff_location}\n\nThank you!\n`);
                        window.location.href = `mailto:${driverEmail}?subject=${subject}&body=${body}`;
                      }}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 hover:underline cursor-pointer bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg transition-colors w-fit"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="m4 4 16 0c1.1 0 2 .9 2 2l0 12c0 1.1-.9 2-2 2l-16 0c-1.1 0-2-.9-2-2l0-12c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Email {driverEmail}</span>
                    </button>
                  )}
                </div>
              </div>
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

          {/* Payment Button for Offers OR Receipt Button for Paid */}
          {shouldShowPaymentButton && !isPaymentCompleted() && (
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

          {/* Receipt Button for Paid Bookings */}
          {isPaymentCompleted() && (
            <div className="pt-2 border-t border-gray-100">
              <Button 
                onClick={() => {
                  // Show receipt or payment details
                  console.log('Show receipt for booking:', booking.id);
                  // TODO: Implement receipt modal or navigation
                }}
                variant="outline"
                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2 bg-white"
              >
                <CreditCard className="w-4 h-4" />
                Receipt
              </Button>
            </div>
          )}

          {/* Confirmed Status */}
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
