
import { useState, useMemo } from 'react';
import { usePaymentTransactions } from '@/hooks/usePaymentTransactions';
import { PaymentSummaryCards } from './PaymentSummaryCards';
import { PaymentTransactionCard } from './PaymentTransactionCard';
import { PaymentFilters } from './PaymentFilters';
import { Loader2 } from 'lucide-react';

export const PaymentsSection = () => {
  const { transactions, summary, loading, error } = usePaymentTransactions();
  const [filters, setFilters] = useState({
    search: '',
    paymentMethod: 'all',
    status: 'all'
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !filters.search || 
        transaction.passenger?.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        transaction.driver?.full_name?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesMethod = filters.paymentMethod === 'all' || 
        transaction.payment_method === filters.paymentMethod;
      
      const matchesStatus = filters.status === 'all' || 
        transaction.payment_status === filters.status;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [transactions, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentSummaryCards summary={summary} />
      
      <PaymentFilters 
        transactions={filteredTransactions}
        onFilterChange={setFilters}
      />

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <PaymentTransactionCard 
                key={transaction.id} 
                transaction={transaction} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
