
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Auto-redirect to dashboard after brief success display
    const redirectTimer = setTimeout(() => {
      if (bookingId) {
        navigate(`/passenger/dashboard?paid=true&booking_id=${bookingId}`);
      } else {
        navigate('/passenger/dashboard');
      }
    }, 3000); // Show success for 3 seconds then redirect

    const fetchBookingDetails = async () => {
      if (!bookingId) {
        // No booking ID, redirect immediately
        navigate('/passenger/dashboard');
        return;
      }

      try {
        const { data: booking, error } = await supabase
          .from('bookings')
          .select(`
            *,
            passengers (
              full_name,
              email
            )
          `)
          .eq('id', bookingId)
          .single();

        if (error || !booking) {
          console.error('Error fetching booking:', error);
          // Still redirect to dashboard even if booking fetch fails
          navigate('/passenger/dashboard');
          return;
        }

        setBookingDetails(booking);
      } catch (error) {
        console.error('Error:', error);
        navigate('/passenger/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();

    // Cleanup timer on unmount
    return () => clearTimeout(redirectTimer);
  }, [bookingId, navigate]);

  const handleContinue = () => {
    if (bookingId) {
      navigate(`/passenger/dashboard?paid=true&booking_id=${bookingId}`);
    } else {
      navigate('/passenger/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Redirecting you to your dashboard...</p>
            <Button onClick={handleContinue}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedAmount = bookingDetails.total_paid_cents 
    ? (bookingDetails.total_paid_cents / 100).toFixed(2)
    : (bookingDetails.offer_price_cents / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Payment Successful!
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Your ride has been confirmed
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Redirecting to dashboard in a moment...
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-medium">
                  #{(bookingDetails.booking_code || bookingDetails.id.slice(-8)).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-medium text-green-600">${formattedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status</span>
                <span className="font-medium text-green-600">Paid</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll receive a confirmation email shortly</li>
                <li>• Your driver will contact you before pickup</li>
                <li>• Track your ride status in the dashboard</li>
              </ul>
            </div>

            <Button 
              onClick={handleContinue}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Return to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Success;
