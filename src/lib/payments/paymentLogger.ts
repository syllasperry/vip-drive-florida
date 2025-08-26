
import { supabase } from '@/integrations/supabase/client';

export interface PaymentLogEntry {
  booking_id: string;
  amount_cents: number;
  currency: string;
  method: string;
  provider_txn_id: string;
  status: string;
  meta?: Record<string, any>;
}

export class PaymentLogger {
  static async logPayment(entry: PaymentLogEntry) {
    try {
      console.log('💳 Logging payment:', entry);
      
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          booking_id: entry.booking_id,
          amount_cents: entry.amount_cents,
          currency: entry.currency || 'USD',
          method: entry.method,
          provider_txn_id: entry.provider_txn_id,
          status: entry.status || 'PAID',
          meta: entry.meta || {}
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to log payment:', error);
        throw error;
      }

      console.log('✅ Payment logged successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Payment logging error:', error);
      throw error;
    }
  }

  static async getPaymentHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          bookings!inner (
            id,
            booking_code,
            passenger_id,
            passengers!inner (
              user_id
            )
          )
        `)
        .eq('bookings.passengers.user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch payment history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Payment history fetch error:', error);
      return [];
    }
  }
}
