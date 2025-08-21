
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { goToBooking } from '@/lib/nav';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const sessionId = searchParams.get('session_id');
  
  const [isPolling, setIsPolling] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const { toast } = useToast();

  const maxPolls = 30; // 30 polls * 2s = 60s max

  const checkPaymentStatus = async () => {
    if (!bookingId) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('payment_status')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      if (data?.payment_status === 'paid') {
        setIsConfirmed(true);
        setIsPolling(false);
        toast({
          title: "Payment Confirmed!",
          description: "Your booking has been successfully paid.",
        });
        
        // Auto-navigate after 2 seconds
        setTimeout(() => {
          goToBooking(bookingId);
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  useEffect(() => {
    if (!bookingId) {
      toast({
        title: "Error",
        description: "No booking ID found in URL",
        variant: "destructive",
      });
      return;
    }

    // Start polling
    const interval = setInterval(() => {
      if (pollCount >= maxPolls) {
        setIsPolling(false);
        clearInterval(interval);
        return;
      }

      checkPaymentStatus();
      setPollCount(prev => prev + 1);
    }, 2000);

    // Initial check
    checkPaymentStatus();

    return () => clearInterval(interval);
  }, [bookingId, pollCount]);

  const handleBackToBooking = () => {
    if (bookingId) {
      goToBooking(bookingId);
    }
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">No booking information found.</p>
            <Button onClick={() => window.location.href = '/passenger/dashboard'}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          {isConfirmed ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Confirmed ✅
              </h1>
              <p className="text-gray-600 mb-6">
                Your payment has been successfully processed and your booking is confirmed.
              </p>
            </>
          ) : (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {isPolling ? 'Payment Processing...' : 'Awaiting Confirmation...'}
              </h1>
              <p className="text-gray-600 mb-6">
                {isPolling 
                  ? 'Your payment was completed on Stripe and we\'re confirming it now.'
                  : 'Your payment is being processed. This may take a few minutes.'
                }
              </p>
            </>
          )}
          
          <Button 
            onClick={handleBackToBooking}
            variant={isConfirmed ? "default" : "outline"}
            className="w-full"
          >
            Back to My Booking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
