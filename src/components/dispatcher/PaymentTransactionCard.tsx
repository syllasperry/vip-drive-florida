
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, CreditCard, Smartphone, Zap } from "lucide-react";
import { PaymentTransaction } from "@/types/booking";

interface PaymentTransactionCardProps {
  transaction: PaymentTransaction;
}

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'stripe_card':
      return <CreditCard className="w-4 h-4" />;
    case 'apple_pay':
    case 'google_pay':
      return <Smartphone className="w-4 h-4" />;
    case 'zelle':
    case 'venmo':
    case 'cash_app':
      return <Zap className="w-4 h-4" />;
    default:
      return <CreditCard className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'succeeded':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'disputed':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const PaymentTransactionCard = ({ transaction }: PaymentTransactionCardProps) => {
  const amount = transaction.amount_cents / 100;
  const commission = transaction.dispatcher_commission_cents / 100;
  const netAmount = transaction.net_driver_amount_cents / 100;

  return (
    <Card className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={transaction.passenger?.profile_photo_url} 
                alt={transaction.passenger?.full_name} 
              />
              <AvatarFallback className="bg-gray-100 text-gray-600">
                {transaction.passenger?.full_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900 text-sm">
                {transaction.passenger?.full_name || 'Unknown Passenger'}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(transaction.transaction_date).toLocaleDateString()} at{' '}
                {new Date(transaction.transaction_date).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${
              transaction.payment_status === 'succeeded' ? 'text-green-600' : 
              transaction.payment_status === 'failed' ? 'text-red-600' : 'text-gray-900'
            }`}>
              ${amount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              Net: ${netAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-gray-600">
              {getPaymentMethodIcon(transaction.payment_method)}
              <span className="text-xs capitalize">
                {transaction.payment_method.replace('_', ' ')}
              </span>
            </div>
            {transaction.stripe_payment_intent_id && (
              <ExternalLink className="w-3 h-3 text-gray-400" />
            )}
          </div>
          
          <Badge className={`text-xs ${getStatusColor(transaction.payment_status)}`}>
            {transaction.payment_status}
          </Badge>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Commission (20%): ${commission.toFixed(2)}</span>
            {transaction.stripe_fee_cents && (
              <span>Stripe fee: ${(transaction.stripe_fee_cents / 100).toFixed(2)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
