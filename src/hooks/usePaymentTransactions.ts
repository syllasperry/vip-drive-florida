
import { useState, useEffect } from 'react';
import { getPaymentTransactions, getPaymentSummary } from '@/data/payments';
import { PaymentTransaction } from '@/types/booking';

export const usePaymentTransactions = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState({
    totalReceived: 0,
    pendingPayments: 0,
    refundsDisputes: 0,
    totalCommission: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [transactionsData, summaryData] = await Promise.all([
        getPaymentTransactions(),
        getPaymentSummary()
      ]);
      
      setTransactions(transactionsData || []);
      setSummary(summaryData || {
        totalReceived: 0,
        pendingPayments: 0,
        refundsDisputes: 0,
        totalCommission: 0
      });
    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Failed to load payment data');
      setTransactions([]);
      setSummary({
        totalReceived: 0,
        pendingPayments: 0,
        refundsDisputes: 0,
        totalCommission: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    transactions,
    summary,
    loading,
    error,
    refetch: fetchData
  };
};
