import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { redirectToCheckout } from '@/lib/stripe/payment';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentButtonProps {
  bookingId: string;
  amount: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const StripePaymentButton: React.FC<StripePaymentButtonProps> = ({
  bookingId,
  amount,
  disabled = false,
  className = '',
  children
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      
      // Redirect to Stripe Checkout
      await redirectToCheckout(bookingId);
    } catch (error) {
      console.error('❌ Payment failed:', error);
      
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('Stripe')) {
          errorMessage = 'Payment service temporarily unavailable. Please try again later.';
        }
      }
      
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? 'cursor-not-allowed' : ''}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          {children || `Pay $${amount.toFixed(2)}`}
        </>
      )}
    </Button>
  );
};