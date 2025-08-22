
import { supabase } from '@/integrations/supabase/client';

export interface PaymentIntentData {
  bookingId: string;
  passengerId: string;
  amountCents: number;
  currency: string;
  metadata?: Record<string, any>;
}

export class PaymentIntegration {
  static async createPaymentIntent(data: PaymentIntentData) {
    try {
      console.log('💳 Creating payment intent:', data);
      
      const { data: response, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          booking_id: data.bookingId,
          passenger_id: data.passengerId,
          amount_cents: data.amountCents,
          currency: data.currency || 'usd',
          metadata: {
            ...data.metadata,
            booking_id: data.bookingId,
            passenger_id: data.passengerId
          }
        }
      });

      if (error) {
        console.error('❌ Payment intent creation failed:', error);
        throw new Error(`Payment setup failed: ${error.message}`);
      }

      return response;
    } catch (error) {
      console.error('❌ Payment integration error:', error);
      throw error;
    }
  }

  static async handlePaymentSuccess(bookingId: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'paid',
          payment_confirmation_status: 'all_set'
        })
        .eq('id', bookingId);

      if (error) {
        console.error('❌ Failed to update booking after payment:', error);
        throw error;
      }

      console.log('✅ Booking payment status updated');
    } catch (error) {
      console.error('❌ Payment success handling error:', error);
      throw error;
    }
  }

  static async handlePaymentFailure(bookingId: string, reason?: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
          status: 'cancelled',
          payment_confirmation_status: 'failed'
        })
        .eq('id', bookingId);

      if (error) {
        console.error('❌ Failed to update booking after payment failure:', error);
        throw error;
      }

      console.log('✅ Booking marked as failed due to payment issue');
    } catch (error) {
      console.error('❌ Payment failure handling error:', error);
      throw error;
    }
  }
}
