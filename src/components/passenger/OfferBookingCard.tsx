
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, CreditCard, CheckCircle, Car, Phone } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { PaymentModal } from '@/components/dashboard/PaymentModal';
import { toast } from '@/hooks/use-toast';

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

  // Auto-show payment modal when offer is received
  useEffect(() => {
    const isOfferReceived = 
      booking.status === 'offer_sent' || 
      booking.ride_status === 'offer_sent' || 
      booking.payment_confirmation_status === 'price_awaiting_acceptance';
    
    const isPaymentPending = 
      booking.payment_confirmation_status === 'waiting_for_payment' ||
      booking.payment_confirmation_status === 'price_awaiting_acceptance';

    // Show payment modal automatically for new offers
    if (isOfferReceived && isPaymentPending && !hasShownOfferNotification) {
      console.log('🎯 Auto-showing payment modal for offer:', booking.id);
      setShowPaymentModal(true);
      setHasShownOfferNotification(true);
      
      // Show friendly notification
      toast({
        title: "Payment Ready",
        description: "Complete your payment to confirm your ride booking.",
      });
    }
  }, [booking.status, booking.ride_status, booking.payment_confirmation_status, hasShownOfferNotification]);

  const getStatusDisplay = () => {
    if (booking.payment_confirmation_status === 'all_set') {
      return { text: 'Confirmed', color: 'bg-green-100 text-green-800 border-green-200' };
    }
    
    if (
      booking.status === 'offer_sent' || 
      booking.ride_status === 'offer_sent' ||
      booking.payment_confirmation_status === 'price_awaiting_acceptance'
    ) {
      return { text: 'Offer Received', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    
    if (
      booking.payment_confirmation_status === 'waiting_for_payment' ||
      booking.payment_confirmation_status === 'passenger_paid'
    ) {
      return { text: 'Payment Processing', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    
    if (booking.status === 'completed') {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
    
    return { text: 'Pending', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const statusDisplay = getStatusDisplay();
  
  // Use final_price_cents as the single source of truth
  const finalPriceCents = booking.final_price_cents;
  const finalPrice = finalPriceCents && finalPriceCents > 0 
    ? (finalPriceCents / 100).toFixed(2)
    : null;

  const shouldShowPaymentButton = 
    (booking.status === 'offer_sent' || 
     booking.ride_status === 'offer_sent' ||
     booking.payment_confirmation_status === 'price_awaiting_acceptance') &&
    booking.payment_confirmation_status !== 'all_set' &&
    booking.payment_confirmation_status !== 'passenger_paid';

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
              {finalPrice ? (
                <p className="text-lg font-semibold text-gray-900">${finalPrice}</p>
              ) : (
                <p className="text-sm text-gray-500">Price pending</p>
              )}
              <p className="text-xs text-gray-500">Total Price</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Driver Information (if assigned) */}
          {booking.driver_id && (
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
          {shouldShowPaymentButton && finalPrice && (
            <div className="pt-2 border-t border-gray-100">
              <Button 
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Pay ${finalPrice} to Confirm Ride
              </Button>
            </div>
          )}

          {/* Show error if price is unavailable */}
          {shouldShowPaymentButton && !finalPrice && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-sm text-red-600 text-center">
                Price unavailable—pull to refresh
              </p>
            </div>
          )}

          {/* Confirmed Status */}
          {booking.payment_confirmation_status === 'all_set' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Ride Confirmed!</p>
                <p className="text-xs text-green-600">Your driver will contact you soon.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && (
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
