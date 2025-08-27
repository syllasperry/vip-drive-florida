
import React from 'react';
import CheckoutTest from '@/components/test/CheckoutTest';

const CheckoutTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Stripe Integration Test
          </h1>
          <p className="text-gray-600">
            Test the complete Stripe checkout flow and webhook processing
          </p>
        </div>
        
        <CheckoutTest />
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Expected Webhook Events:</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              <code>checkout.session.completed</code> - When payment is successful
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              <code>payment_intent.succeeded</code> - Payment confirmation
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              <code>payment_intent.payment_failed</code> - Payment failure
            </li>
          </ul>
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-600">
              <strong>Testing Steps:</strong><br/>
              1. Click "Test Stripe Checkout"<br/>
              2. Complete payment in Stripe (use test card: 4242 4242 4242 4242)<br/>
              3. Check booking status to verify webhook processing<br/>
              4. Check console logs for webhook event details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutTestPage;
