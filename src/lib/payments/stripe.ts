
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface StripeCheckoutResponse {
  url?: string;
  error?: string;
}

export async function startCheckout(bookingId: string): Promise<void> {
  try {
    console.log('🚀 Starting checkout for booking:', bookingId);

    const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
      body: { booking_id: bookingId }
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

    const response = data as StripeCheckoutResponse;

    if (response.error) {
      console.error('❌ Checkout response error:', response.error);
      toast({
        title: "Payment Error", 
        description: response.error,
        variant: "destructive",
      });
      return;
    }

    if (response.url) {
      console.log('✅ Redirecting to Stripe Checkout:', response.url);
      window.location.href = response.url;
    } else {
      console.error('❌ No checkout URL received');
      toast({
        title: "Payment Error",
        description: "No checkout URL received. Please try again.",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error('❌ Unexpected checkout error:', error);
    toast({
      title: "Payment Error",
      description: "An unexpected error occurred. Please check your connection and try again.",
      variant: "destructive",
    });
  }
}
