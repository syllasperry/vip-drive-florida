
import React from 'react';

export const PaymentsTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
      <div className="text-center py-8 text-gray-500">
        <p>No payment history yet</p>
        <p className="text-sm">Your payment history will appear here</p>
      </div>
    </div>
  );
};
