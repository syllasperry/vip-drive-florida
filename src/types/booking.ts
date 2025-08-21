
export type { Booking } from '@/lib/types/booking';

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  passenger_id: string;
  driver_id: string;
  currency: string;
  amount_cents: number;
  payment_method: 'stripe_card' | 'apple_pay' | 'google_pay' | 'zelle' | 'venmo' | 'cash_app' | 'other';
  payment_status: 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed';
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_fee_cents?: number;
  dispatcher_commission_cents: number;
  net_driver_amount_cents: number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
  passenger?: {
    full_name: string;
    profile_photo_url?: string;
  };
  driver?: {
    full_name: string;
  };
}
