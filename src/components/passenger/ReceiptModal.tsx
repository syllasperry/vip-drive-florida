import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, X } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  const formatCurrency = (cents: number, currency: string = 'USD') => {
    return `$${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  };

  const formatPaymentMethod = (provider: string) => {
    if (!provider) return 'Unknown';
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-center text-lg font-bold">
            RECEIPT
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-6 w-6 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Booking Code:</span>
                <span className="font-semibold">
                  {booking.booking_code || 'VIP-PENDING'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Paid:</span>
                <span className="font-semibold text-green-600">
                  {booking.paid_amount_cents 
                    ? formatCurrency(booking.paid_amount_cents, booking.paid_currency)
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <span className="font-semibold">
                  {formatPaymentMethod(booking.payment_provider)}
                </span>
              </div>
              
              {booking.stripe_payment_intent_id && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reference:</span>
                  <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {booking.stripe_payment_intent_id}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Paid At:</span>
                <span className="font-semibold">
                  {booking.paid_at 
                    ? format(new Date(booking.paid_at), 'MMM d, yyyy - h:mm a')
                    : 'N/A'
                  }
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Route:</span>
                  <div className="text-right text-xs">
                    <div>{booking.pickup_location}</div>
                    <div className="text-gray-500">↓</div>
                    <div>{booking.dropoff_location}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
            <CreditCard className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Payment Confirmed</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};