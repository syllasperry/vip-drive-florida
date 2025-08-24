
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, DollarSign, CheckCircle, Clock } from "lucide-react";
import { format } from 'date-fns';

interface PaymentsTabProps {
  bookings: any[];
}

export const PaymentsTab = ({ bookings }: PaymentsTabProps) => {
  // Filter bookings with payment information
  const paymentBookings = bookings.filter(booking => 
    booking.final_price || booking.estimated_price
  );

  const getPaymentStatus = (booking: any) => {
    if (booking.status === 'completed') return 'paid';
    if (booking.status === 'all_set') return 'confirmed';
    if (booking.status === 'payment_pending') return 'pending';
    return 'unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Payment Pending';
      default: return 'Unknown';
    }
  };

  const totalPaid = paymentBookings
    .filter(booking => getPaymentStatus(booking) === 'paid')
    .reduce((sum, booking) => sum + (booking.final_price || booking.estimated_price || 0), 0);

  const totalPending = paymentBookings
    .filter(booking => getPaymentStatus(booking) === 'pending')
    .reduce((sum, booking) => sum + (booking.final_price || booking.estimated_price || 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
      
      {/* Payment Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${totalPaid}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">${totalPending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {paymentBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
          <p className="text-gray-500">Your payment history will appear here after booking rides.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Payment History</h3>
          {paymentBookings.map((booking) => {
            const paymentStatus = getPaymentStatus(booking);
            return (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        #{booking.id.slice(-8).toUpperCase()}
                      </span>
                      <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(paymentStatus)}`}>
                        {getStatusLabel(paymentStatus)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        ${booking.final_price || booking.estimated_price || 0}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {booking.pickup_location.split(',')[0]} → {booking.dropoff_location.split(',')[0]}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{format(new Date(booking.pickup_time), 'MMM dd, yyyy')}</span>
                    {booking.driver_name && (
                      <span>Driver: {booking.driver_name}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
