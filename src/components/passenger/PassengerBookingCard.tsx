
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, Phone, Mail, Car } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Driver {
  id: string;
  full_name: string;
  phone?: string;
  email?: string;
  avatar?: string;
}

interface PassengerBookingCardProps {
  booking: {
    id: string;
    booking_code: string;
    status: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_time: string;
    offer_price_cents?: number;
    final_price_cents?: number;
    assigned_driver_id?: string;
    drivers?: Driver;
  };
  onPayClick?: () => void;
}

export const PassengerBookingCard: React.FC<PassengerBookingCardProps> = ({
  booking,
  onPayClick
}) => {
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'paid' | 'unpaid'>('checking');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check payment status on mount and when booking changes
  useEffect(() => {
    checkPaymentStatus();
  }, [booking.id, booking.booking_code]);

  const checkPaymentStatus = async () => {
    if (!booking.booking_code) return;

    try {
      // Direct Supabase check for booking status
      const response = await fetch(`https://extdyjkfgftbokabiamc.supabase.co/rest/v1/bookings?booking_code=eq.${booking.booking_code}&select=status,payment_status,paid_at`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dGR5amtmZ2Z0Ym9rYWJpYW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTU2MjMsImV4cCI6MjA2ODc5MTYyM30.BQsUy0nX3Aj_aAzTSGGQFWWt7zFYf7fQmKPveRsM3vk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dGR5amtmZ2Z0Ym9rYWJpYW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTU2MjMsImV4cCI6MjA2ODc5MTYyM30.BQsUy0nX3Aj_aAzTSGGQFWWt7zFYf7fQmKPveRsM3vk',
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const bookingData = data[0];
        const isPaid = bookingData.status === 'paid' || bookingData.payment_status === 'paid' || bookingData.paid_at;
        setPaymentStatus(isPaid ? 'paid' : 'unpaid');
      } else {
        setPaymentStatus('unpaid');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('unpaid');
    }
  };

  const handlePayClick = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Call create-checkout-session API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_code: booking.booking_code,
          currency: 'usd'
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Check for reconciliation on page load if session_id is present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      reconcilePayment(sessionId);
    }
  }, []);

  const reconcilePayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/reconcile?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.paid) {
        setPaymentStatus('paid');
        toast({
          title: "Payment Confirmed!",
          description: "Your booking has been paid successfully.",
        });
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Reconciliation error:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const getStatusBadge = () => {
    if (paymentStatus === 'paid') {
      return <Badge className="bg-green-100 text-green-800">PAID</Badge>;
    }
    return <Badge variant="outline">{booking.status.toUpperCase()}</Badge>;
  };

  const isPaid = paymentStatus === 'paid';
  const priceToShow = booking.final_price_cents || booking.offer_price_cents || 0;

  const driver = booking.drivers;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              #{booking.booking_code}
            </h3>
            {getStatusBadge()}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Price</p>
            <p className="text-xl font-bold">{formatCurrency(priceToShow)}</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{booking.pickup_location}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 truncate">{booking.dropoff_location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-gray-600">
              {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        </div>

        {/* Driver Info Block - Show when paid */}
        {isPaid && driver && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Your Driver
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                {driver.avatar ? (
                  <img src={driver.avatar} alt={driver.full_name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  driver.full_name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{driver.full_name}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  {driver.phone && (
                    <a href={`tel:${driver.phone}`} className="hover:text-blue-600">
                      <Phone className="w-3 h-3 inline mr-1" />
                      {driver.phone}
                    </a>
                  )}
                  {driver.email && (
                    <a href={`mailto:${driver.email}`} className="hover:text-blue-600">
                      <Mail className="w-3 h-3 inline mr-1" />
                      {driver.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pay Button - Hide when paid */}
        {!isPaid && (
          <div className="flex gap-2">
            <Button 
              onClick={handlePayClick}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Pay to Confirm Ride'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
