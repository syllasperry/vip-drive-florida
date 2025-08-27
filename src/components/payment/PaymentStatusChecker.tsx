import React, { useEffect, useState } from 'react';
import { verifyPaymentStatus } from '@/lib/stripe/payment';
import { useToast } from '@/hooks/use-toast';

interface PaymentStatusCheckerProps {
  bookingId: string;
  onPaymentConfirmed: () => void;
  checkInterval?: number;
}

export const PaymentStatusChecker: React.FC<PaymentStatusCheckerProps> = ({
  bookingId,
  onPaymentConfirmed,
  checkInterval = 3000
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!bookingId) return;

    const checkPaymentStatus = async () => {
      try {
        setIsChecking(true);
        const { isPaid } = await verifyPaymentStatus(bookingId);
        
        if (isPaid) {
          console.log('✅ Payment confirmed for booking:', bookingId);
          toast({
            title: "Payment Confirmed!",
            description: "Your ride has been confirmed successfully.",
          });
          onPaymentConfirmed();
          return true; // Stop checking
        }
        
        return false; // Continue checking
      } catch (error) {
        console.error('❌ Error checking payment status:', error);
        return false;
      } finally {
        setIsChecking(false);
      }
    };

    // Initial check
    checkPaymentStatus();

    // Set up interval checking
    const interval = setInterval(async () => {
      const shouldStop = await checkPaymentStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, checkInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [bookingId, onPaymentConfirmed, checkInterval, toast]);

  return null; // This is a utility component with no UI
};