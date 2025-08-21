import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, CreditCard, Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ContributorInfoModal } from "@/components/pdf/ContributorInfoModal";
import { PDFGenerator } from "@/components/pdf/PDFGenerator";
import { toast } from "sonner";

interface PaymentsTabProps {
  userId: string;
  userType: "passenger" | "driver";
  onViewSummary?: (booking: any) => void;
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  driverName: string;
  paymentMethod: string;
  bookingData: any;
}

export const PaymentsTab = ({ userId, userType, onViewSummary }: PaymentsTabProps) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContributorModal, setShowContributorModal] = useState(false);
  const [pdfAction, setPdfAction] = useState<'download' | 'email'>('download');
  const [userProfileData, setUserProfileData] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      loadPaymentHistory();
      loadUserProfile();
    }
  }, [userId, userType]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserProfileData(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      
      console.log('Loading payment history for:', { userId, userType });
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
        drivers!driver_id(
          full_name,
          preferred_payment_method,
          payment_instructions
        )
        `)
        .eq(userType === 'passenger' ? 'passenger_id' : 'driver_id', userId)
        .eq('payment_confirmation_status', 'all_set')
        .not('final_price', 'is', null)
        .order('pickup_time', { ascending: false });

      console.log('Payment query result:', { bookings, error });

      if (error) throw error;

      const paymentRecords: PaymentRecord[] = (bookings || []).map(booking => {
        const driverName = booking.drivers?.full_name || 'Unknown Driver';
        const paymentMethod = booking.payment_method || booking.drivers?.preferred_payment_method || 'Unknown';
        
        // Format payment method display
        let paymentMethodDisplay = paymentMethod;
        if (paymentMethod === 'zelle') paymentMethodDisplay = 'Paid via Zelle';
        else if (paymentMethod === 'venmo') paymentMethodDisplay = 'Paid via Venmo';
        else if (paymentMethod === 'apple_pay') paymentMethodDisplay = 'Paid via Apple Pay';
        else if (paymentMethod === 'google_pay') paymentMethodDisplay = 'Paid via Google Pay';
        else if (paymentMethod === 'payment_link') paymentMethodDisplay = 'Paid via Payment Link';
        else if (paymentMethod === 'cash') paymentMethodDisplay = 'Paid in Cash';
        else paymentMethodDisplay = `Paid via ${paymentMethod}`;

        return {
          id: booking.id,
          amount: booking.final_price || booking.estimated_price || 0,
          date: booking.pickup_time,
          driverName,
          paymentMethod: paymentMethodDisplay,
          bookingData: booking
        };
      });

      setPayments(paymentRecords);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePDFAction = (action: 'download' | 'email') => {
    setPdfAction(action);
    setShowContributorModal(true);
  };

  const generatePaymentReport = async (contributorInfo: { type: 'individual' | 'business'; name: string }) => {
    try {
      const records = payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.date,
        paymentMethod: payment.paymentMethod,
        counterpartyName: payment.driverName
      }));

      const pdfData = {
        title: 'Passenger Payment Summary',
        contributorInfo,
        records,
        userType: 'passenger' as const
      };

      const doc = PDFGenerator.generate(pdfData);
      const filename = `passenger-payment-summary-${new Date().toISOString().split('T')[0]}.pdf`;

      if (pdfAction === 'email') {
        await PDFGenerator.shareByEmail(doc, filename);
      } else {
        doc.save(filename);
      }

      toast.success(`Payment report ${pdfAction === 'email' ? 'shared' : 'downloaded'} successfully!`);
    } catch (error) {
      console.error('Error generating payment report:', error);
      toast.error('Failed to generate payment report');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-2">No payments yet</h3>
        <p className="text-sm text-muted-foreground">
          Your completed rides and payments will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {payments.length} completed {payments.length === 1 ? 'payment' : 'payments'}
        </div>
        
        {payments.length > 0 && (
          <div className="flex gap-2">
            <Button 
              onClick={() => handlePDFAction('download')}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button 
              onClick={() => handlePDFAction('email')}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Send by Email
            </Button>
          </div>
        )}
      </div>
      
      {payments.map((payment) => (
        <Card 
          key={payment.id} 
          className="hover:shadow-sm transition-shadow cursor-pointer"
          onClick={() => onViewSummary?.(payment.bookingData)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground text-sm">
                    {format(new Date(payment.date), 'MMM dd, yyyy – h:mm a')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.driverName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {payment.paymentMethod}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">
                  ${payment.amount.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  Paid
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <ContributorInfoModal
        isOpen={showContributorModal}
        onClose={() => setShowContributorModal(false)}
        onSubmit={generatePaymentReport}
        title="Passenger Payment Report"
        initialData={userProfileData?.account_type && userProfileData?.account_name ? {
          type: userProfileData.account_type,
          name: userProfileData.account_name
        } : null}
      />
    </div>
  );
};