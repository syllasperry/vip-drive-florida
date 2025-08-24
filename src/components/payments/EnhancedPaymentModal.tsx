
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SmartPricingEngine } from '@/lib/pricing/smartPricing';
import { format } from 'date-fns';

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentConfirmed: () => void;
  isSmartPriceEnabled?: boolean;
}

export const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onPaymentConfirmed,
  isSmartPriceEnabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Calculate pricing breakdown
  const uberEstimateCents = booking.estimated_price_cents || (booking.estimated_price * 100) || 10000; // Default $100
  const pricingBreakdown = SmartPricingEngine.calculatePrice(uberEstimateCents);
  const formattedBreakdown = SmartPricingEngine.formatBreakdown(pricingBreakdown);

  const handlePayment = async () => {
    if (!booking?.id) {
      toast({
        title: "Error",
        description: "Invalid booking information",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('🔄 Starting payment process for booking:', booking.id);
      
      // Call the Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          booking_id: booking.id,
          amount_cents: pricingBreakdown.totalCents,
          breakdown: pricingBreakdown
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
      
      // Open Stripe checkout in new tab (better UX)
      window.open(data.url, '_blank');
      
      toast({
        title: "Payment Started",
        description: "Complete your payment in the new tab to confirm your booking.",
      });

      onClose();
      
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
                {isSmartPriceEnabled && (
                  <Badge className="text-xs bg-purple-100 text-purple-800">
                    SmartPrice ON
                  </Badge>
                )}
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

          {/* Pricing Breakdown */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Price Breakdown</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Uber Premier estimate</span>
                  <span>{formattedBreakdown.uberEstimate}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee (30%)</span>
                  <span>{formattedBreakdown.dispatcherFee}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formattedBreakdown.subtotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing fee</span>
                  <span>{formattedBreakdown.stripeFee}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formattedBreakdown.total}</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                💡 All fees included upfront. No hidden charges.
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
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formattedBreakdown.total}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
