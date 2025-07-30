import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PaymentsTabProps {
  userId: string;
  userType: "passenger" | "driver";
}

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  rideId: string;
}

export const PaymentsTab = ({ userId, userType }: PaymentsTabProps) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadPaymentHistory();
    }
  }, [userId, userType]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          final_price,
          estimated_price,
          pickup_time,
          pickup_location,
          dropoff_location
        `)
        .eq(userType === 'passenger' ? 'passenger_id' : 'driver_id', userId)
        .eq('payment_confirmation_status', 'all_set')
        .not('final_price', 'is', null)
        .order('pickup_time', { ascending: false });

      if (error) throw error;

      const paymentRecords: PaymentRecord[] = (bookings || []).map(booking => {
        // Create a simple ride identifier from locations
        const fromLocation = booking.pickup_location.split(',')[0] || 'Unknown';
        const toLocation = booking.dropoff_location.split(',')[0] || 'Unknown';
        const rideIdentifier = `${fromLocation} → ${toLocation}`;

        return {
          id: booking.id,
          amount: booking.final_price || booking.estimated_price || 0,
          date: booking.pickup_time,
          rideId: rideIdentifier
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
      <div className="text-sm text-muted-foreground mb-4">
        {payments.length} completed {payments.length === 1 ? 'payment' : 'payments'}
      </div>
      
      {payments.map((payment) => (
        <Card key={payment.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {format(new Date(payment.date), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-48">
                    {payment.rideId}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-foreground">
                  ${payment.amount.toFixed(2)}
                </div>
                <div className="text-xs text-green-600">
                  Paid
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};