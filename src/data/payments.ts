
import { supabase } from "@/integrations/supabase/client";
import { PaymentTransaction } from "@/types/booking";

export const getPaymentTransactions = async (): Promise<PaymentTransaction[]> => {
  try {
    // Since payment_transactions table might not exist yet, let's create mock data from bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        final_price,
        payment_method,
        payment_confirmation_status,
        passenger_id,
        driver_id,
        created_at,
        passengers(full_name, profile_photo_url),
        drivers(full_name)
      `)
      .not('final_price', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching payment data:", error);
      return [];
    }

    // Convert bookings to payment transactions format
    return (bookings || []).map((booking: any) => ({
      id: booking.id,
      booking_id: booking.id,
      passenger_id: booking.passenger_id,
      driver_id: booking.driver_id,
      currency: 'USD',
      amount_cents: Math.round((booking.final_price || 0) * 100),
      payment_method: (booking.payment_method || 'stripe_card') as 'stripe_card' | 'apple_pay' | 'google_pay' | 'zelle' | 'venmo' | 'cash_app' | 'other',
      payment_status: booking.payment_confirmation_status === 'all_set' ? 'succeeded' : 'pending' as 'pending' | 'succeeded' | 'failed' | 'refunded' | 'disputed',
      stripe_payment_intent_id: null,
      stripe_charge_id: null,
      stripe_fee_cents: Math.round((booking.final_price || 0) * 100 * 0.029 + 30),
      dispatcher_commission_cents: Math.round((booking.final_price || 0) * 100 * 0.20),
      net_driver_amount_cents: Math.round((booking.final_price || 0) * 100 * 0.71),
      transaction_date: booking.created_at,
      created_at: booking.created_at,
      updated_at: booking.created_at,
      metadata: {},
      passenger: booking.passengers ? {
        full_name: booking.passengers.full_name,
        profile_photo_url: booking.passengers.profile_photo_url
      } : undefined,
      driver: booking.drivers ? {
        full_name: booking.drivers.full_name
      } : undefined
    }));
  } catch (error) {
    console.error("Unexpected error fetching payment data:", error);
    return [];
  }
};

export const getPaymentSummary = async () => {
  try {
    const transactions = await getPaymentTransactions();
    
    const summary = transactions.reduce((acc, transaction) => {
      const amount = transaction.amount_cents / 100;
      const commission = transaction.dispatcher_commission_cents / 100;

      switch (transaction.payment_status) {
        case 'succeeded':
          acc.totalReceived += amount;
          acc.totalCommission += commission;
          break;
        case 'pending':
          acc.pendingPayments += amount;
          break;
        case 'refunded':
        case 'disputed':
          acc.refundsDisputes += amount;
          break;
      }
      return acc;
    }, {
      totalReceived: 0,
      pendingPayments: 0,
      refundsDisputes: 0,
      totalCommission: 0
    });

    return summary;
  } catch (error) {
    console.error("Unexpected error fetching payment summary:", error);
    return {
      totalReceived: 0,
      pendingPayments: 0,
      refundsDisputes: 0,
      totalCommission: 0
    };
  }
};

export const exportPaymentData = (transactions: PaymentTransaction[], format: 'csv' | 'pdf') => {
  if (format === 'csv') {
    const headers = [
      'Date',
      'Passenger',
      'Driver', 
      'Amount',
      'Payment Method',
      'Status',
      'Commission (20%)',
      'Stripe Fee',
      'Net to Driver'
    ];

    const csvData = transactions.map(t => [
      new Date(t.transaction_date).toLocaleDateString(),
      t.passenger?.full_name || 'Unknown',
      t.driver?.full_name || 'Unknown',
      `$${(t.amount_cents / 100).toFixed(2)}`,
      t.payment_method,
      t.payment_status,
      `$${(t.dispatcher_commission_cents / 100).toFixed(2)}`,
      `$${((t.stripe_fee_cents || 0) / 100).toFixed(2)}`,
      `$${(t.net_driver_amount_cents / 100).toFixed(2)}`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};
