
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, MapPin, Clock, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = searchParams.get('bookingId');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (!bookingId) {
        console.error('No booking ID provided');
        navigate('/passenger/dashboard');
        return;
      }

      try {
        setLoading(true);

        // Update booking status to paid
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            payment_confirmation_status: 'passenger_paid',
            stripe_payment_intent_id: sessionId,
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking:', updateError);
          toast({
            title: "Warning",
            description: "Payment successful but booking status update failed. Please contact support.",
            variant: "destructive",
          });
        }

        // Fetch updated booking details
        const { data: bookingData, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            *,
            passengers (
              full_name,
              email
            ),
            drivers (
              full_name,
              car_make,
              car_model,
              car_color
            )
          `)
          .eq('id', bookingId)
          .single();

        if (fetchError) {
          console.error('Error fetching booking:', fetchError);
        } else {
          setBooking(bookingData);

          // Trigger email notifications
          try {
            const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation-emails', {
              body: { booking_id: bookingId }
            });

            if (emailError) {
              console.error('Error sending confirmation emails:', emailError);
              toast({
                title: "Email Notification",
                description: "Payment successful but confirmation emails may be delayed.",
              });
            } else {
              console.log('✅ Confirmation emails triggered successfully');
            }
          } catch (emailError) {
            console.error('Error triggering emails:', emailError);
          }
        }

        toast({
          title: "Payment Successful!",
          description: "Your ride has been confirmed. Check your email for booking details.",
        });

      } catch (error) {
        console.error('Error handling payment success:', error);
        toast({
          title: "Error",
          description: "An error occurred processing your payment confirmation.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [bookingId, sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF385C] mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  const finalPrice = booking?.final_price_cents 
    ? (booking.final_price_cents / 100).toFixed(2)
    : booking?.final_price?.toFixed(2) || '0.00';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-800">Payment Successful!</CardTitle>
            <p className="text-green-700 text-sm">Your ride has been confirmed</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {booking && (
              <>
                {/* Booking Details */}
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Booking</span>
                    <span className="font-medium">#{booking.booking_code || booking.id.slice(-8).toUpperCase()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Amount Paid</span>
                    <span className="font-semibold text-lg">${finalPrice}</span>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-sm">{booking.pickup_location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">To</p>
                        <p className="text-sm">{booking.dropoff_location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Pickup Time</p>
                        <p className="text-sm">
                          {new Date(booking.pickup_time).toLocaleDateString()} at{' '}
                          {new Date(booking.pickup_time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">What's Next?</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Check your email for booking confirmation</li>
                    <li>• Your driver will receive the booking details</li>
                    <li>• You'll be contacted before pickup time</li>
                    <li>• Track your booking in the dashboard</li>
                  </ul>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={() => navigate('/passenger/dashboard')}
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white"
              >
                View My Bookings
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/passenger/price-estimate')}
                className="w-full"
              >
                Book Another Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
