
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PriceBreakdown {
  base: number;
  dispatcher_fee: number;
  app_fee: number;
  subtotal: number;
  stripe_pct: number;
  stripe_fixed: number;
  amount_cents: number;
}

export interface CheckoutResponse {
  ok: boolean;
  url: string;
  breakdown: PriceBreakdown;
}

export async function prepareCheckout(bookingId: string): Promise<CheckoutResponse> {
  try {
    console.log('🚀 Preparing checkout for booking:', bookingId);

    const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
      body: { booking_id: bookingId }
    });

    if (error) {
      console.error('❌ Stripe checkout error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to prepare payment process. Please try again.",
        variant: "destructive",
      });
      throw new Error(error.message || "Failed to prepare checkout");
    }

    const response = data as CheckoutResponse;

    if (!response.ok || !response.url) {
      console.error('❌ Invalid checkout response:', response);
      toast({
        title: "Payment Error", 
        description: "Invalid payment response. Please try again.",
        variant: "destructive",
      });
      throw new Error("Invalid checkout response");
    }

    console.log('✅ Checkout prepared successfully');
    return response;
  } catch (error) {
    console.error('❌ Unexpected checkout error:', error);
    toast({
      title: "Payment Error",
      description: "An unexpected error occurred. Please check your connection and try again.",
      variant: "destructive",
    });
    throw error;
  }
}

export async function startCheckout(bookingId: string): Promise<void> {
  try {
    const response = await prepareCheckout(bookingId);
    console.log('✅ Redirecting to Stripe Checkout:', response.url);
    window.location.href = response.url;
  } catch (error) {
    // Error handling already done in prepareCheckout
    console.error('❌ Failed to start checkout:', error);
  }
}
