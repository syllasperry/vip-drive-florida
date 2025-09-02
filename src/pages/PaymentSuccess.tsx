import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { verifyPaymentStatus } from "@/lib/stripe/payment";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const bookingId = searchParams.get('booking_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!bookingId) {
        console.error('❌ No booking ID found in URL');
        toast({
          title: "Payment Error",
          description: "Missing booking information. Redirecting to dashboard.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/passenger/dashboard'), 2000);
        return;
      }

      try {
        console.log('🔍 Verifying payment for booking:', bookingId);
        
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { isPaid } = await verifyPaymentStatus(bookingId);
        
        if (isPaid) {
          console.log('✅ Payment verified successfully');
          setPaymentVerified(true);
          toast({
            title: "Payment Successful!",
            description: "Your ride has been confirmed successfully.",
          });
        } else {
          console.warn('⚠️ Payment not yet confirmed, will redirect anyway');
          setPaymentVerified(true);
          toast({
            title: "Payment Processing",
            description: "Your payment is being processed. Check your dashboard for updates.",
          });
        }
      } catch (error) {
        console.error('❌ Error verifying payment:', error);
        setPaymentVerified(true); // Allow redirect anyway
        toast({
          title: "Payment Submitted",
          description: "Your payment was submitted. Check your dashboard for confirmation.",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [bookingId, toast, navigate]);

  // Auto-redirect after 3 seconds
  useEffect(() => {
    if (paymentVerified && !isVerifying) {
      const timer = setTimeout(() => {
        console.log('🚀 Redirecting to passenger dashboard...');
        navigate('/passenger/dashboard', { replace: true });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [paymentVerified, isVerifying, navigate]);

  const handleGoToDashboard = () => {
    navigate('/passenger/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full text-center space-y-6">
        {isVerifying ? (
          <>
            <div className="flex justify-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Verifying Payment...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              Your ride payment has been processed successfully.
            </p>
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Redirecting to your dashboard in a few seconds...
              </p>
              {bookingId && (
                <p className="text-xs text-muted-foreground">
                  Booking ID: {bookingId.slice(0, 8).toUpperCase()}
                </p>
              )}
              {sessionId && (
                <p className="text-xs text-muted-foreground">
                  Session: {sessionId.slice(0, 8)}
                </p>
              )}
            </div>
            <Button 
              onClick={handleGoToDashboard}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;