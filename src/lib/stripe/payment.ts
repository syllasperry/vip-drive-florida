import { supabase } from '@/integrations/supabase/client';
import { getStripe } from './client';

export interface PaymentBreakdown {
  baseAmount: number;
  dispatcherFee: number;
  appFee: number;
  stripeFee: number;
  totalAmount: number;
}

export const calculatePaymentBreakdown = (basePrice: number): PaymentBreakdown => {
  const dispatcherFee = basePrice * 0.20; // 20% dispatcher commission
  const appFee = basePrice * 0.10; // 10% app fee
  const subtotal = basePrice + dispatcherFee + appFee;
  
  // Stripe fee calculation (2.9% + $0.30)
  const stripeFee = (subtotal * 0.029) + 0.30;
  const totalAmount = subtotal + stripeFee;
  
  return {
    baseAmount: basePrice,
    dispatcherFee,
    appFee,
    stripeFee,
    totalAmount: Math.round(totalAmount * 100) / 100 // Round to 2 decimal places
  };
};

export const createPaymentSession = async (bookingId: string) => {
  try {
    console.log('🔄 Creating Stripe payment session for booking:', bookingId);
    
    const { data, error } = await supabase.functions.invoke('stripe-start-checkout', {
      body: { booking_id: bookingId }
    });

    if (error) {
      console.error('❌ Error creating payment session:', error);
      throw new Error(error.message || 'Failed to create payment session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL received from Stripe');
    }

    console.log('✅ Payment session created successfully');
    return data;
  } catch (error) {
    console.error('❌ Payment session creation failed:', error);
    throw error;
  }
};

export const redirectToCheckout = async (bookingId: string) => {
  try {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const sessionData = await createPaymentSession(bookingId);
    
    // Redirect to Stripe Checkout
    window.location.href = sessionData.url;
  } catch (error) {
    console.error('❌ Checkout redirect failed:', error);
    throw error;
  }
};

export const verifyPaymentStatus = async (bookingId: string) => {
  try {
    console.log('🔍 Verifying payment status for booking:', bookingId);
    
    // First check current booking status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('❌ Error fetching booking:', bookingError);
      return { isPaid: false, error: bookingError.message };
    }

    console.log('📊 Current booking status:', {
      id: booking.id,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_confirmation_status: booking.payment_confirmation_status,
      paid_at: booking.paid_at,
      stripe_payment_intent_id: booking.stripe_payment_intent_id
    });

    // Check if already paid
    const isPaid = booking.payment_status === 'paid' && 
                  booking.payment_confirmation_status === 'all_set' &&
                  booking.paid_at;

    if (isPaid) {
      console.log('✅ Booking is already paid');
      return { isPaid: true, booking };
    }

    // Check if there's a Stripe session to verify by calling our verification function
    try {
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment-status', {
        body: { booking_id: bookingId }
      });

      if (verifyError) {
        console.error('❌ Error in verify-payment-status function:', verifyError);
      } else if (verifyResult?.updated) {
        console.log('✅ Payment status updated by verification function');
        return { isPaid: true, booking: verifyResult.booking };
      }
    } catch (functionError) {
      console.error('❌ Error calling verify-payment-status function:', functionError);
    }

    return { isPaid, booking };
  } catch (error) {
    console.error('❌ Error verifying payment status:', error);
    return { isPaid: false, booking: null };
  }
};