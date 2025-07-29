import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, User } from "lucide-react";
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
  driverName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
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
          dropoff_location,
          payment_status,
          status,
          drivers:driver_id (
            full_name
          )
        `)
        .eq(userType === 'passenger' ? 'passenger_id' : 'driver_id', userId)
        .eq('payment_status', 'completed')
        .order('pickup_time', { ascending: false });

      if (error) throw error;

      const paymentRecords: PaymentRecord[] = (bookings || []).map(booking => ({
        id: booking.id,
        amount: booking.final_price || booking.estimated_price || 0,
        date: booking.pickup_time,
        driverName: booking.drivers?.full_name || 'Unknown Driver',
        pickupLocation: booking.pickup_location,
        dropoffLocation: booking.dropoff_location,
        status: booking.status
      }));

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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Showing {payments.length} completed {payments.length === 1 ? 'payment' : 'payments'}
      </div>
      
      {payments.map((payment) => (
        <Card key={payment.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  Driver: {payment.driverName}
                </span>
              </div>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                Paid
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(new Date(payment.date), 'MMM dd, yyyy - hh:mm a')}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground mb-3">
              <div className="truncate">
                📍 {payment.pickupLocation}
              </div>
              <div className="truncate">
                🏁 {payment.dropoffLocation}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">Amount</span>
              <span className="text-lg font-bold text-primary">
                ${payment.amount.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};