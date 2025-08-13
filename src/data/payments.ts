
import { supabase } from "@/integrations/supabase/client";

export interface PaymentTransaction {
  id: string;
  booking_id: string;
  passenger_id: string;
  driver_id: string;
  currency: string;
  amount_cents: number;
  payment_method: string;
  payment_status: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  stripe_fee_cents?: number;
  dispatcher_commission_cents: number;
  net_driver_amount_cents: number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export const fetchPaymentTransactions = async () => {
  // For now, return mock data since the table isn't available in types yet
  const mockTransactions: PaymentTransaction[] = [
    {
      id: '1',
      booking_id: 'booking-1',
      passenger_id: 'passenger-1',
      driver_id: 'driver-1',
      currency: 'usd',
      amount_cents: 5000,
      payment_method: 'stripe_card',
      payment_status: 'succeeded',
      dispatcher_commission_cents: 1000,
      net_driver_amount_cents: 3850,
      stripe_fee_cents: 150,
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  return mockTransactions;
};

export const calculateSummary = (transactions: PaymentTransaction[]) => {
  const totalReceived = transactions
    .filter(t => t.payment_status === 'succeeded')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const pendingPayments = transactions
    .filter(t => t.payment_status === 'pending')
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalDispatcherCommission = transactions
    .filter(t => t.payment_status === 'succeeded')
    .reduce((sum, t) => sum + t.dispatcher_commission_cents, 0);

  const refundsDisputes = transactions
    .filter(t => ['refunded', 'disputed'].includes(t.payment_status))
    .reduce((sum, t) => sum + t.amount_cents, 0);

  return {
    totalReceived: totalReceived / 100,
    pendingPayments: pendingPayments / 100,
    refundsDisputes: refundsDisputes / 100,
    totalDispatcherCommission: totalDispatcherCommission / 100
  };
};
