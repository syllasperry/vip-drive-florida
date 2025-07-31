import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface EarningsSectionProps {
  driverId: string | undefined;
}

interface EarningsData {
  today: number;
  week: number;
  month: number;
}

export const EarningsSection = ({ driverId }: EarningsSectionProps) => {
  const [earnings, setEarnings] = useState<EarningsData>({
    today: 0,
    week: 0,
    month: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!driverId) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch completed bookings where both parties confirmed payment
        const { data: completedBookings, error } = await supabase
          .from('bookings')
          .select('final_price, created_at')
          .eq('driver_id', driverId)
          .eq('payment_confirmation_status', 'all_set')
          .not('final_price', 'is', null);

        if (error) {
          console.error('Error fetching earnings:', error);
          return;
        }

        const bookings = completedBookings || [];
        
        // Calculate earnings for different periods
        const todayEarnings = bookings
          .filter(booking => new Date(booking.created_at) >= startOfToday)
          .reduce((sum, booking) => sum + (Number(booking.final_price) || 0), 0);

        const weekEarnings = bookings
          .filter(booking => new Date(booking.created_at) >= startOfWeek)
          .reduce((sum, booking) => sum + (Number(booking.final_price) || 0), 0);

        const monthEarnings = bookings
          .filter(booking => new Date(booking.created_at) >= startOfMonth)
          .reduce((sum, booking) => sum + (Number(booking.final_price) || 0), 0);

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          month: monthEarnings
        });
      } catch (error) {
        console.error('Error calculating earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();

    // Set up real-time subscription for payment confirmations
    const channel = supabase
      .channel('earnings-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          // Refetch earnings when payment status changes to all_set
          if (payload.new.payment_confirmation_status === 'all_set') {
            fetchEarnings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <CardContent className="p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Today's Earnings</h3>
            <p className="text-3xl font-bold text-primary">${earnings.today.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {earnings.today > 0 ? 'From confirmed payments' : 'No earnings yet today'}
            </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-muted-foreground">This Week</h3>
              <p className="text-2xl font-bold text-foreground">${earnings.week.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm text-muted-foreground">This Month</h3>
              <p className="text-2xl font-bold text-foreground">${earnings.month.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {earnings.today === 0 && earnings.week === 0 && earnings.month === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Your earnings will appear here once passengers confirm payments and you confirm receipt.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};