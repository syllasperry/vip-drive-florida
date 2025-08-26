
import React, { useState } from 'react';
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

  const getStatusDisplay = () => {
    if (booking.payment_confirmation_status === 'all_set') {
      return { text: 'Ride Confirmed', color: 'bg-green-100 text-green-800 border-green-200' };
    }
    
    if (booking.payment_status === 'paid' || booking.payment_confirmation_status === 'passenger_paid') {
      return { text: 'Payment Successful', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    
    if (
      booking.status === 'offer_sent' || 
      booking.ride_status === 'offer_sent' ||
      booking.payment_confirmation_status === 'price_awaiting_acceptance'
    ) {
      return { text: 'Offer Sent', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }
    
    return { text: 'Processing', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const statusDisplay = getStatusDisplay();
  const finalPrice = booking.final_price_cents 
    ? (booking.final_price_cents / 100).toFixed(2)
    : booking.final_price?.toFixed(2) 
    || booking.estimated_price?.toFixed(2) 
    || '0.00';

  const shouldShowPaymentButton = 
    (booking.status === 'offer_sent' || 
     booking.ride_status === 'offer_sent' ||
     booking.payment_confirmation_status === 'price_awaiting_acceptance') &&
    booking.payment_confirmation_status !== 'all_set' &&
    booking.payment_confirmation_status !== 'passenger_paid';

  const isPaymentSuccessful = 
    booking.payment_status === 'paid' || 
    booking.payment_confirmation_status === 'passenger_paid';

  const isRideConfirmed = booking.payment_confirmation_status === 'all_set';

  const handlePaymentConfirmed = () => {
    setShowPaymentModal(false);
    toast({
      title: "Payment Processing",
      description: "Your payment is being processed. You'll receive confirmation shortly.",
    });
  };

  const getDriverInitials = () => {
    if (!booking.drivers?.full_name) return 'D';
    return booking.drivers.full_name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
              <p className="text-lg font-semibold text-gray-900">${finalPrice}</p>
              <p className="text-xs text-gray-500">Total Price</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Route Information */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">From</p>
                <p className="text-sm text-gray-600">{booking.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">To</p>
                <p className="text-sm text-gray-600">{booking.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* Pickup Time */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
            </span>
          </div>

          {/* Driver Information (if assigned) */}
          {booking.drivers && (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Driver</h4>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-gray-200">
                  <AvatarImage 
                    src={booking.drivers.profile_photo_url || undefined} 
                    alt={booking.drivers.full_name || 'Driver'}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-[#FF385C] text-white font-semibold">
                    {getDriverInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {booking.drivers.full_name}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Car className="w-3 h-3" />
                    <span>
                      {booking.drivers.car_color} {booking.drivers.car_make} {booking.drivers.car_model}
                    </span>
                  </div>
                  {booking.drivers.license_plate && (
                    <p className="text-xs text-gray-500">Plate: {booking.drivers.license_plate}</p>
                  )}
                </div>

                {booking.drivers.phone && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{booking.drivers.phone}</span>
                  </div>
                )}
              </div>
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
                Pay ${finalPrice} to Confirm Ride
              </Button>
            </div>
          )}

          {/* Payment Successful Status */}
          {isPaymentSuccessful && !isRideConfirmed && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-800">Payment Successful!</p>
                <p className="text-xs text-blue-600">Waiting for final confirmation...</p>
              </div>
            </div>
          )}

          {/* Ride Confirmed Status */}
          {isRideConfirmed && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Ride Confirmed!</p>
                <p className="text-xs text-green-600">Your driver will contact you soon. Check your email for booking details.</p>
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
