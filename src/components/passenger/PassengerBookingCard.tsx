
import React, { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Clock, User, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Booking } from '@/hooks/useMyBookings';

interface PassengerBookingCardProps {
  booking: Booking;
}

const PassengerBookingCard: React.FC<PassengerBookingCardProps> = ({ booking }) => {
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const { toast } = useToast();

  // Determine if booking is paid based on database values
  const isPaid = booking.status === 'paid' || booking.payment_status === 'paid' || !!booking.paid_at;
  
  // Determine if payment is needed (offer sent but not paid)
  const needsPayment = !isPaid && (
    booking.status === 'offer_sent' || 
    booking.ride_status === 'offer_sent' ||
    booking.payment_confirmation_status === 'offer_sent'
  ) && booking.offer_price_cents;

  console.log(`Booking ${booking.id} payment check:`, {
    status: booking.status,
    payment_status: booking.payment_status,
    paid_at: booking.paid_at,
    isPaid,
    needsPayment,
    offer_price_cents: booking.offer_price_cents
  });

  const handlePayment = async () => {
    if (!booking.offer_price_cents) {
      toast({
        title: "Payment Error",
        description: "No price available for this booking",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPaymentLoading(true);
      
      console.log('🔄 Starting payment process for booking:', booking.id);
      
      const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
        body: { booking_id: booking.id }
      });

      if (error) {
        console.error('❌ Stripe checkout error:', error);
        toast({
          title: "Payment Error",
          description: error.message || "Failed to start payment process. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data?.url) {
        console.error('❌ No checkout URL received');
        toast({
          title: "Payment Error",
          description: "Failed to create payment session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Redirecting to Stripe Checkout:', data.url);
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isPaid) {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
    }
    if (needsPayment) {
      return <Badge className="bg-yellow-100 text-yellow-800">Awaiting Payment</Badge>;
    }
    return <Badge variant="outline">{booking.status || 'Pending'}</Badge>;
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">
                #{booking.booking_code || booking.id.slice(-8).toUpperCase()}
              </h3>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
            </div>
          </div>
          
          {booking.offer_price_cents && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(booking.offer_price_cents)}
              </div>
              {isPaid && booking.paid_at && (
                <div className="text-xs text-green-600">
                  Paid {format(new Date(booking.paid_at), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600 break-words">
              {booking.pickup_location}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600 break-words">
              {booking.dropoff_location}
            </span>
          </div>
        </div>

        {/* Driver Info */}
        {booking.drivers && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">{booking.drivers.full_name}</span>
            {booking.drivers.car_make && booking.drivers.car_model && (
              <>
                <Car className="w-4 h-4 text-gray-600 ml-2" />
                <span className="text-sm text-gray-600">
                  {booking.drivers.car_make} {booking.drivers.car_model}
                  {booking.drivers.car_color && ` (${booking.drivers.car_color})`}
                </span>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {needsPayment && (
            <Button 
              onClick={handlePayment}
              disabled={isPaymentLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isPaymentLoading ? 'Processing...' : `Pay ${formatPrice(booking.offer_price_cents)} to Confirm Ride`}
            </Button>
          )}
          
          {isPaid && (
            <div className="flex-1 text-center py-2 text-green-600 font-medium">
              ✅ Ride Confirmed & Paid
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PassengerBookingCard;
