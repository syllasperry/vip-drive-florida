
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, CheckCircle, Clock, Download, Receipt } from "lucide-react";
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
    const paymentStatus = booking.payment_confirmation_status?.toLowerCase();
    const rideStatus = booking.ride_status?.toLowerCase();
    
    if (paymentStatus === 'all_set') return 'completed';
    if (paymentStatus === 'passenger_paid') return 'paid';
    if (rideStatus === 'offer_sent') return 'offer_sent';
    if (paymentStatus === 'waiting_for_payment') return 'pending';
    return 'unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'offer_sent': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'paid': return 'Payment Confirmed';
      case 'offer_sent': return 'Awaiting Payment';
      case 'pending': return 'Pending Offer';
      default: return 'Unknown';
    }
  };

  const totalCompleted = paymentBookings
    .filter(booking => getPaymentStatus(booking) === 'completed')
    .reduce((sum, booking) => sum + (booking.final_price || booking.estimated_price || 0), 0);

  const totalPending = paymentBookings
    .filter(booking => ['offer_sent', 'pending'].includes(getPaymentStatus(booking)))
    .reduce((sum, booking) => sum + (booking.final_price || booking.estimated_price || 0), 0);

  const handleDownloadReceipt = (booking: any) => {
    // This would generate and download a receipt
    console.log('Downloading receipt for booking:', booking.id);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Payments & Receipts</h2>
      
      {/* Payment Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Total Paid</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${totalCompleted.toFixed(2)}</p>
            <p className="text-xs text-green-600">Completed rides</p>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Awaiting Payment</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">${totalPending.toFixed(2)}</p>
            <p className="text-xs text-orange-600">Active offers</p>
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
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Payment History</h3>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
          
          {paymentBookings.map((booking) => {
            const paymentStatus = getPaymentStatus(booking);
            const canDownload = ['completed', 'paid'].includes(paymentStatus);
            
            return (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        #{(booking.booking_code || booking.id.slice(-8)).toUpperCase()}
                      </span>
                      <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(paymentStatus)}`}>
                        {getStatusLabel(paymentStatus)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold text-gray-900">
                          ${booking.final_price || booking.estimated_price || 0}
                        </span>
                      </div>
                      {canDownload && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadReceipt(booking)}
                          className="gap-1 p-2"
                        >
                          <Receipt className="w-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {booking.pickup_location.split(',')[0]} → {booking.dropoff_location.split(',')[0]}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{format(new Date(booking.pickup_time), 'MMM dd, yyyy')}</span>
                    <div className="flex items-center gap-4">
                      {booking.driver_name && paymentStatus === 'completed' && (
                        <span>Driver: {booking.driver_name}</span>
                      )}
                      {booking.vehicle_type && (
                        <span>{booking.vehicle_type}</span>
                      )}
                    </div>
                  </div>

                  {/* Action button for pending payments */}
                  {paymentStatus === 'offer_sent' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Button size="sm" className="w-full">
                        Review Offer & Pay
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2 text-sm text-gray-600">
            <p>• All payments are processed securely through our payment system</p>
            <p>• Pricing includes all fees and taxes upfront</p>
            <p>• Receipts are available for download after payment completion</p>
            <p>• Cancellation and refund policies apply as per terms of service</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
