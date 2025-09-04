
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, DollarSign, CheckCircle, Clock, Download, Receipt } from "lucide-react";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

      // Calculate total paid amount using fallback calculation
      const fallbackTotal = (paidData || []).reduce((sum, booking) => {
        const amount = booking.paid_amount_cents 
          ? booking.paid_amount_cents / 100
          : booking.final_price || booking.estimated_price || 0;
        return sum + amount;
      }, 0);
      setTotalPaid(fallbackTotal);

      // Calculate awaiting payments from bookings prop
      const awaitingTotal = bookings
        .filter(booking => ['offer_sent', 'pending'].includes(booking.status))
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

  const handleDownloadReceipt = async (booking: any) => {
    try {
      // Get current user and passenger data for receipt
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: passenger } = await supabase
        .from('passengers')
        .select('full_name, email, phone')
        .eq('user_id', user.id)
        .single();

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('VIP Transportation Receipt', 20, 30);
      
      // Booking details
      doc.setFontSize(12);
      const bookingCode = booking.booking_code || booking.id.slice(-8).toUpperCase();
      doc.text(`Receipt #: ${bookingCode}`, 20, 50);
      doc.text(`Date: ${format(new Date(booking.pickup_time || booking.created_at), 'MMM dd, yyyy hh:mm a')}`, 20, 60);
      
      // Passenger info
      if (passenger) {
        doc.text(`Passenger: ${passenger.full_name || 'N/A'}`, 20, 80);
        if (passenger.email) doc.text(`Email: ${passenger.email}`, 20, 90);
      }
      
      // Trip details
      doc.text('Trip Details:', 20, 110);
      doc.text(`Pickup: ${booking.pickup_location}`, 30, 120);
      doc.text(`Drop-off: ${booking.dropoff_location}`, 30, 130);
      if (booking.vehicle_type) doc.text(`Vehicle: ${booking.vehicle_type}`, 30, 140);
      
      // Payment details
      const amount = getBookingAmount(booking);
      doc.text('Payment Details:', 20, 160);
      doc.text(`Amount Paid: $${amount.toFixed(2)} USD`, 30, 170);
      doc.text('Payment Method: Card', 30, 180);
      doc.text('Status: Paid', 30, 190);
      
      // Footer
      doc.setFontSize(10);
      doc.text('Thank you for choosing VIP Transportation!', 20, 220);
      
      doc.save(`VIP-Receipt-${bookingCode}.pdf`);
      
      toast({
        title: "Success",
        description: "Receipt downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to generate receipt. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async () => {
    try {
      if (paymentBookings.length === 0) {
        toast({
          title: "No Data",
          description: "No payment history to export.",
          variant: "destructive",
        });
        return;
      }

      // Get current user and passenger data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: passenger } = await supabase
        .from('passengers')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('VIP Transportation - Payment History', 20, 30);
      
      // Summary info
      doc.setFontSize(12);
      if (passenger?.full_name) {
        doc.text(`Customer: ${passenger.full_name}`, 20, 50);
      }
      doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`, 20, 60);
      doc.text(`Total Rides: ${paymentBookings.length}`, 20, 70);
      doc.text(`Total Paid: $${totalPaid.toFixed(2)} USD`, 20, 80);
      
      // Table data
      const tableData = paymentBookings.map(booking => [
        booking.booking_code || booking.id.slice(-8).toUpperCase(),
        format(new Date(booking.pickup_time || booking.created_at), 'MMM dd, yyyy'),
        booking.pickup_location.split(',')[0] || 'Pickup',
        booking.dropoff_location.split(',')[0] || 'Dropoff',
        booking.vehicle_type || 'Standard',
        `$${getBookingAmount(booking).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 100,
        head: [['Booking ID', 'Date', 'Pickup', 'Drop-off', 'Vehicle', 'Amount']],
        body: tableData,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [255, 56, 92] },
        theme: 'striped'
      });
      
      doc.save(`VIP-Payment-History-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "Success",
        description: "Payment history exported successfully!",
      });
    } catch (error) {
      console.error('Error exporting payment history:', error);
      toast({
        title: "Error",
        description: "Failed to export payment history. Please try again.",
        variant: "destructive",
      });
    }
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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportAll}>
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
                    {canDownload && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadReceipt(booking)}
                        className="gap-1 p-2"
                      >
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    )}
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
                  {['pending', 'offer_sent'].includes(booking.status) && (
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
