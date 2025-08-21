
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import { goToBooking } from '@/lib/nav';

const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const handleBackToBooking = () => {
    if (bookingId) {
      goToBooking(bookingId);
    } else {
      window.location.href = '/passenger/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Canceled
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your payment was canceled. You can try again anytime.
          </p>
          
          <Button 
            onClick={handleBackToBooking}
            className="w-full"
          >
            Back to My Booking
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
