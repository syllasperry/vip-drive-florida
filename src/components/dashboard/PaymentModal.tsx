
import React, { useState } from 'react';
import { useEffect } from 'react';
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

  // CRITICAL FIX: Check if payment is already completed before showing modal
  const isPaymentCompleted = () => {
    // Comprehensive payment completion check
    const indicators = {
      payment_status: booking.payment_status === 'paid',
      confirmation_status: booking.payment_confirmation_status === 'all_set',
      general_status: booking.status === 'payment_confirmed',
      ride_status: booking.ride_status === 'all_set',
      paid_fields: booking.paid_at && booking.paid_amount_cents > 0,
      stripe_reference: booking.stripe_payment_intent_id && booking.payment_reference
    };
    
    const isCompleted = Object.values(indicators).some(Boolean);
    
    if (isCompleted) {
      console.log('💳 Payment completion detected in modal:', {
        booking_id: booking.id,
        indicators,
        timestamp: new Date().toISOString()
      });
    }
    
    return isCompleted;
  };

  // CRITICAL FIX: Auto-close modal if payment is completed
  useEffect(() => {
    if (isPaymentCompleted()) {
      console.log('💳 Payment already completed, closing modal');
      onClose();
    }
  }, [booking.payment_status, booking.payment_confirmation_status, booking.status, booking.paid_at, onClose]);

  // Use offer_price_cents as the single source of truth for pricing
  const getFormattedPrice = () => {
    // CRITICAL FIX: Use paid amount if payment is completed
    if (isPaymentCompleted() && booking.paid_amount_cents > 0) {
      return (booking.paid_amount_cents / 100).toFixed(2);
    }
    
    if (booking.offer_price_cents && booking.offer_price_cents > 0) {
      return (booking.offer_price_cents / 100).toFixed(2);
    }
    // Fallback to other price fields if offer_price_cents is not available
    if (booking.final_price_cents && booking.final_price_cents > 0) {
      return (booking.final_price_cents / 100).toFixed(2);
    }
    if (booking.estimated_price_cents && booking.estimated_price_cents > 0) {
      return (booking.estimated_price_cents / 100).toFixed(2);
    }
    if (booking.final_price && booking.final_price > 0) {
      return booking.final_price.toFixed(2);
    }
    if (booking.estimated_price && booking.estimated_price > 0) {
      return booking.estimated_price.toFixed(2);
    }
    return null;
  };

  const formattedPrice = getFormattedPrice();
  const formattedTotal = formattedPrice ? `$${formattedPrice}` : '';

  const handlePayment = async () => {
    // CRITICAL FIX: Prevent payment if already completed
    if (isPaymentCompleted()) {
      toast({
        title: "Payment Already Completed",
        description: "This booking has already been paid for.",
      });
      onClose();
      return;
    }
    
    if (!booking?.id) {
      toast({
        title: "Erro",
        description: "Informações da reserva inválidas",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      console.log('🔄 Iniciando checkout Stripe para reserva:', booking.id);
      console.log('💰 Preço da oferta:', booking.offer_price_cents);
      
      // Call the Stripe checkout edge function
      const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
        body: { 
          booking_id: booking.id
        }
      });

      console.log('📤 Resposta do edge function:', { data, error });

      if (error) {
        console.error('❌ Erro no checkout Stripe:', error);
        
        // Handle specific error cases
        let errorMessage = error.message || "Falha ao iniciar processo de pagamento. Tente novamente.";
        
        if (error.message === 'missing_offer_price_cents') {
          errorMessage = "Preço indisponível - entre em contato com o suporte";
        } else if (error.message?.includes('Stripe configuration')) {
          errorMessage = "Sistema de pagamento temporariamente indisponível - tente novamente mais tarde";
        } else if (error.message?.includes('Network error')) {
          errorMessage = "Problema de conexão - verifique sua internet e tente novamente";
        } else if (error.message?.includes('Access denied')) {
          errorMessage = "Acesso negado - tente fazer login novamente";
        } else if (error.message?.includes('Booking not found')) {
          errorMessage = "Reserva não encontrada - atualize a página e tente novamente";
        } else if (error.message?.includes('Invalid API Key') || error.message?.includes('Stripe configuration error')) {
          errorMessage = "Erro de configuração do sistema de pagamento - entre em contato com o suporte";
        }
        
        toast({
          title: "Erro no Pagamento",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (!data?.url) {
        console.error('❌ URL de checkout não recebida:', data);
        toast({
          title: "Erro no Pagamento",
          description: "Falha ao criar sessão de pagamento. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Redirecionando para Stripe Checkout:', data.url);
      
      // CRITICAL FIX: Mark payment as processing before redirect
      await supabase
        .from('bookings')
        .update({
          payment_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
      
      // Redirect to Stripe hosted checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('❌ Erro no pagamento:', error);
      toast({
        title: "Erro no Pagamento",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // CRITICAL FIX: Don't render modal if payment is completed
  if (isPaymentCompleted()) {
    return null;
  }

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

          {/* Pricing - Passenger only sees total */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-gray-900">{formattedTotal}</span>
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
              disabled={isProcessing || !formattedPrice}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay to Confirm Ride
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
