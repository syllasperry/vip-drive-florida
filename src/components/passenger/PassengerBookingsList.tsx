
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users, Car, MessageCircle, Phone, CreditCard } from 'lucide-react';
import { fetchMyBookings, subscribeMyBookings, PassengerBooking } from '@/lib/passenger/api';
import { prepareCheckout, CheckoutResponse } from '@/lib/payments/stripe';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { BookingChatModal } from '@/components/chat/BookingChatModal';
import { PriceBreakdownDialog } from '@/components/payments/PriceBreakdownDialog';
import { AvatarWithFallback } from '@/components/ui/avatar-with-fallback';

interface PassengerBookingsListProps {
  onUpdate?: () => void;
}

export const PassengerBookingsList: React.FC<PassengerBookingsListProps> = ({ onUpdate }) => {
  const [bookings, setBookings] = useState<PassengerBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [preparingPayment, setPreparingPayment] = useState<string | null>(null);
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading passenger bookings...');
      const rows = await fetchMyBookings();
      setBookings(rows);
      console.log('✅ Loaded', rows.length, 'bookings');
    } catch (err: any) {
      console.error('❌ fetchMyBookings error:', err);
      toast({
        title: 'Error',
        description: 'Failed to load bookings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    const off = subscribeMyBookings(() => {
      console.log('🔔 Real-time update - refreshing bookings...');
      load();
      onUpdate?.();
    });
    return () => off();
  }, [load, onUpdate]);

  const handlePaymentClick = async (booking: PassengerBooking) => {
    const priceDollars = booking.final_price_cents ? booking.final_price_cents / 100 : 0;
    
    if (!priceDollars || priceDollars <= 0) {
      toast({
        title: "Payment Not Available",
        description: "No amount available for payment yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      setPreparingPayment(booking.id);
      const response = await prepareCheckout(booking.id);
      setCheckoutData(response);
      setShowBreakdown(true);
    } catch (error) {
      console.error('Payment preparation error:', error);
    } finally {
      setPreparingPayment(null);
    }
  };

  const handleConfirmPayment = () => {
    if (checkoutData?.url) {
      console.log('✅ Redirecting to Stripe Checkout:', checkoutData.url);
      window.location.href = checkoutData.url;
    }
    setShowBreakdown(false);
    setCheckoutData(null);
  };

  const handleCancelPayment = () => {
    setShowBreakdown(false);
    setCheckoutData(null);
  };

  const getStatusBadge = (booking: PassengerBooking) => {
    const hasDriver = booking.driver_full_name;
    const hasPrice = booking.final_price_cents && booking.final_price_cents > 0;
    
    if (hasPrice && !hasDriver) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          PAYMENT READY
        </Badge>
      );
    }
    
    if (hasDriver && hasPrice) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          READY TO PAY
        </Badge>
      );
    }
    
    if (!hasDriver) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          PENDING DRIVER
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        CONFIRMED
      </Badge>
    );
  };

  // Check if booking is paid
  const isBookingPaid = (booking: PassengerBooking) => {
    return booking.payment_status === 'paid' || booking.status === 'completed';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading skeleton */}
        <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
        <div className="animate-pulse bg-gray-200 h-64 rounded-xl"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Car className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
        <p className="text-gray-600 mb-6">Start your VIP journey by booking your first ride</p>
        <Button 
          onClick={() => navigate('/passenger/price-estimate')}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Book Your First Ride
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {bookings.map((booking) => {
          const passengerName = booking.passenger_first_name && booking.passenger_last_name 
            ? `${booking.passenger_first_name} ${booking.passenger_last_name}`.trim()
            : booking.passenger_first_name || 'VIP Passenger';
          const priceDollars = booking.final_price_cents ? booking.final_price_cents / 100 : 0;

          return (
            <Card key={booking.id} className="overflow-hidden shadow-sm">
              <CardContent className="p-6">
                {/* Avatar Section */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative inline-block">
                    <AvatarWithFallback 
                      src={booking.passenger_photo_url} 
                      fullName={passengerName} 
                      size="md" 
                    />
                    {booking.driver_full_name && (
                      <div className="absolute -bottom-1 -right-1 border-2 border-white rounded-full">
                        <AvatarWithFallback 
                          src={booking.driver_photo_url} 
                          fullName={booking.driver_full_name} 
                          size="sm" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {passengerName}
                    </div>
                    {booking.driver_full_name && (
                      <div className="text-xs text-blue-600">
                        Driver: {booking.driver_full_name}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(booking)}
                </div>

                {/* Pickup and Drop-off */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Pickup</div>
                      <div className="text-gray-600 text-sm">{booking.pickup_location}</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Drop-off</div>
                      <div className="text-gray-600 text-sm">{booking.dropoff_location}</div>
                    </div>
                  </div>
                </div>

                {/* Booking Meta */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  {booking.pickup_time && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(booking.pickup_time), 'MMM dd, yyyy - HH:mm')}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>1 passenger</span>
                  </div>
                </div>

                {/* Vehicle Info */}
                {booking.vehicle_type && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
                    <Car className="w-4 h-4" />
                    <span>{booking.vehicle_type}</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-red-500">
                    ${priceDollars > 0 ? priceDollars.toFixed(2) : 'TBD'}
                  </div>
                </div>

                {/* Driver Info */}
                {booking.driver_full_name && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="font-medium text-gray-900 mb-3">Your Assigned Driver</div>
                    <div className="flex items-center space-x-3 mb-3">
                      <AvatarWithFallback 
                        src={booking.driver_photo_url} 
                        fullName={booking.driver_full_name} 
                        size="lg"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {booking.driver_full_name}
                        </div>
                        <div className="text-blue-600 text-sm">
                          Professional Driver
                        </div>
                      </div>
                    </div>
                    
                    {/* Driver Action Buttons */}
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setChatBookingId(booking.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment CTA - only show if booking is not paid and has a price */}
                {!isBookingPaid(booking) && priceDollars > 0 && (
                  <Button 
                    onClick={() => handlePaymentClick(booking)}
                    disabled={preparingPayment === booking.id}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {preparingPayment === booking.id 
                      ? 'Preparing...' 
                      : `Pay $${priceDollars.toFixed(2)} - Complete Booking`
                    }
                  </Button>
                )}

                {/* No driver assigned yet */}
                {!booking.driver_full_name && (
                  <div className="text-center py-6 text-gray-500">
                    <p>Waiting for driver assignment...</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setChatBookingId(booking.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Price Breakdown Dialog */}
      {showBreakdown && checkoutData && (
        <PriceBreakdownDialog
          open={showBreakdown}
          onClose={handleCancelPayment}
          onConfirm={handleConfirmPayment}
          breakdown={checkoutData.breakdown}
        />
      )}

      {/* Chat Modal */}
      {chatBookingId && (
        <BookingChatModal
          isOpen={!!chatBookingId}
          onClose={() => setChatBookingId(null)}
          bookingId={chatBookingId}
          role="passenger"
        />
      )}
    </>
  );
};
