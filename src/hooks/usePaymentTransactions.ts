
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
      const [transactionsData, summaryData] = await Promise.all([
        getPaymentTransactions(),
        getPaymentSummary()
      ]);
      
      setTransactions(transactionsData);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      console.error('Error fetching payment data:', err);
      setError('Failed to load payment data');
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
