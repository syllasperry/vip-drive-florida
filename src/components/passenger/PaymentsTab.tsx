
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, CheckCircle, Clock, Download, Receipt } from "lucide-react";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface PaymentsTabProps {
  bookings: any[];
}

export const PaymentsTab = ({ bookings }: PaymentsTabProps) => {
  const [paidBookings, setPaidBookings] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [awaitingTotal, setAwaitingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get passenger ID
      const { data: passenger } = await supabase
        .from('passengers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!passenger) return;

      // Query paid bookings
      const { data: paidData, error: paidError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_code,
          pickup_location,
          dropoff_location,
          pickup_time,
          final_price,
          estimated_price,
          vehicle_type,
          created_at,
          paid_amount_cents,
          offer_price_cents
        `)
        .eq('passenger_id', passenger.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (paidError) {
        console.error('Error fetching paid bookings:', paidError);
        throw paidError;
      }

      // Calculate total paid amount
      const { data: totalPaidData, error: totalPaidError } = await supabase
        .rpc('calculate_total_paid', { p_passenger_id: passenger.id });

      if (totalPaidError) {
        console.error('Error calculating total paid:', totalPaidError);
        // Fallback calculation
        const fallbackTotal = (paidData || []).reduce((sum, booking) => {
          const amount = booking.paid_amount_cents 
            ? booking.paid_amount_cents / 100
            : booking.final_price || booking.estimated_price || 0;
          return sum + amount;
        }, 0);
        setTotalPaid(fallbackTotal);
      } else {
        setTotalPaid(totalPaidData || 0);
      }

      // Calculate awaiting payments (offer_sent status)
      // Calculate awaiting payments from bookings prop
      const awaitingTotal = bookings
        .filter(booking => booking.status === 'offer_sent')
        .reduce((sum, booking) => {
          const amount = booking.offer_price_cents 
            ? booking.offer_price_cents / 100
            : booking.final_price || booking.estimated_price || 0;
          return sum + amount;
        }, 0);
      setAwaitingTotal(awaitingTotal);

      setPaidBookings(paidData || []);

    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: "Error",
        description: "Failed to load payment data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings with payment information
  const paymentBookings = loading ? [] : paidBookings;

  const getPaymentStatus = (booking: any) => {
    // For paid bookings, always return completed
    if (booking.status === 'paid') return 'completed';
    
    // Fallback for other statuses
    const paymentStatus = booking.payment_confirmation_status?.toLowerCase();
    if (paymentStatus === 'all_set') return 'completed';
    if (paymentStatus === 'passenger_paid') return 'paid';
    return 'completed'; // Default for paid bookings
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

  const getBookingAmount = (booking: any) => {
    // Use paid_amount_cents if available (most accurate)
    if (booking.paid_amount_cents && booking.paid_amount_cents > 0) {
      return booking.paid_amount_cents / 100;
    }
    // Fallback to other price fields
    return booking.final_price || booking.estimated_price || 0;
  };

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
            <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            <p className="text-xs text-green-600">Completed rides</p>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Awaiting Payment</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">${awaitingTotal.toFixed(2)}</p>
            <p className="text-xs text-orange-600">Active offers</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF385C] mx-auto mb-4"></div>
          <p className="text-gray-500">Loading payment history...</p>
        </div>
      ) : paymentBookings.length === 0 ? (
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
                        ${getBookingAmount(booking).toFixed(2)}
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
                    {booking.pickup_location?.split(',')[0] || 'Pickup'} → {booking.dropoff_location?.split(',')[0] || 'Dropoff'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{format(new Date(booking.pickup_time || booking.created_at), 'MMM dd, yyyy')}</span>
                    <div className="flex items-center gap-4">
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
