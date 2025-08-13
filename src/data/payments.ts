
import { supabase } from "@/integrations/supabase/client";
import { PaymentTransaction } from "@/types/booking";

export const getPaymentTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select(`
        *,
        bookings!inner(
          passengers(full_name, profile_photo_url),
          drivers(full_name)
        )
      `)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error("Error fetching payment transactions:", error);
      return [];
    }

    return data?.map((transaction: any) => ({
      ...transaction,
      passenger: transaction.bookings?.passengers,
      driver: transaction.bookings?.drivers
    })) || [];
  } catch (error) {
    console.error("Unexpected error fetching payment transactions:", error);
    return [];
  }
};

export const getPaymentSummary = async () => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('amount_cents, payment_status, dispatcher_commission_cents');

    if (error) {
      console.error("Error fetching payment summary:", error);
      return {
        totalReceived: 0,
        pendingPayments: 0,
        refundsDisputes: 0,
        totalCommission: 0
      };
    }

    const summary = data?.reduce((acc, transaction) => {
      const amount = transaction.amount_cents / 100; // Convert cents to dollars
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

    return summary || {
      totalReceived: 0,
      pendingPayments: 0,
      refundsDisputes: 0,
      totalCommission: 0
    };
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
