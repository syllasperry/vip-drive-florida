
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentConfirmed
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Use offer_price_cents as the source of truth for the payment amount
  const offerPriceCents = booking.offer_price_cents || booking.final_price_cents || booking.estimated_price_cents;
  const totalAmount = offerPriceCents ? (offerPriceCents / 100).toFixed(2) : '0.00';
  const hasValidPrice = offerPriceCents && offerPriceCents > 0;

  const handlePayment = async () => {
    if (!booking?.id) {
      toast({
        title: "Error",
        description: "Invalid booking information",
        variant: "destructive",
      });
      return;
    }

    if (!hasValidPrice) {
      toast({
        title: "Error",
        description: "Price unavailable. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('🔄 Starting payment process for booking:', booking.id);
      
      // Call the Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
        body: { 
          booking_id: booking.id
        }
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
      
      // Open Stripe checkout in new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Payment Started",
        description: "Complete your payment in the new tab to confirm your booking.",
      });

      // Close modal and trigger confirmation
      onClose();
      onPaymentConfirmed();
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-red-600" />
            Confirm Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Summary */}
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  #{(booking.booking_code || booking.id.slice(-8)).toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {booking.pickup_location?.split(',')[0] || 'Pickup location'}
                </span>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  {booking.dropoff_location?.split(',')[0] || 'Dropoff location'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">
                  {format(new Date(booking.pickup_time), 'MMM d, yyyy \'at\' h:mm a')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-gray-900">Total Amount</span>
                {hasValidPrice ? (
                  <span className="text-2xl font-bold text-gray-900">${totalAmount}</span>
                ) : (
                  <span className="text-sm text-gray-500">Price unavailable</span>
                )}
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>• Premium ride service</p>
                <p>• All fees included upfront</p>
                <p>• No hidden charges</p>
                <p>• Secure payment processing</p>
                <p>• Email confirmation included</p>
              </div>

              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  ✓ Price locked in - no surge pricing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              disabled={isProcessing || !hasValidPrice}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : hasValidPrice ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ${totalAmount}
                </>
              ) : (
                'Price unavailable'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
