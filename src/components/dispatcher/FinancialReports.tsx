
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, DollarSign, TrendingUp, Users } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface FinancialSummary {
  totalEarnings: number;
  totalRides: number;
  dispatcherCommission: number;
  driverPayouts: number;
  averageRideValue: number;
}

interface BookingData {
  id: string;
  estimated_price: number;
  created_at: string;
  pickup_location: string;
  dropoff_location: string;
  passengers?: {
    full_name: string;
  };
}

export const FinancialReports = () => {
  const { toast } = useToast();
  const [reportPeriod, setReportPeriod] = useState('this_month');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalEarnings: 0,
    totalRides: 0,
    dispatcherCommission: 0,
    driverPayouts: 0,
    averageRideValue: 0
  });
  const [recentBookings, setRecentBookings] = useState<BookingData[]>([]);

  useEffect(() => {
    loadFinancialData();
  }, [reportPeriod]);

  const getDateRange = () => {
    const now = new Date();
    switch (reportPeriod) {
      case 'last_7_days':
        return { start: subDays(now, 7), end: now };
      case 'last_30_days':
        return { start: subDays(now, 30), end: now };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id,
          estimated_price,
          created_at,
          pickup_location,
          dropoff_location,
          passengers (
            full_name
          )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .not('estimated_price', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const bookingData = bookings || [];
      const totalEarnings = bookingData.reduce((sum, booking) => sum + (booking.estimated_price || 0), 0);
      const totalRides = bookingData.length;
      const dispatcherCommission = totalEarnings * 0.20; // 20% commission
      const driverPayouts = totalEarnings - dispatcherCommission - (totalEarnings * 0.029); // Minus Stripe fees
      const averageRideValue = totalRides > 0 ? totalEarnings / totalRides : 0;

      setSummary({
        totalEarnings,
        totalRides,
        dispatcherCommission,
        driverPayouts,
        averageRideValue
      });

      setRecentBookings(bookingData.slice(0, 10) as BookingData[]);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ['Date', 'Booking ID', 'Passenger', 'Route', 'Amount'].join(','),
      ...recentBookings.map(booking => [
        format(new Date(booking.created_at), 'yyyy-MM-dd'),
        booking.id.slice(-8),
        booking.passengers?.full_name || 'Unknown',
        `${booking.pickup_location} → ${booking.dropoff_location}`,
        `$${booking.estimated_price}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Track earnings and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="this_month">This month</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={recentBookings.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading financial data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.totalEarnings.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalRides}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission (20%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.dispatcherCommission.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Ride Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${summary.averageRideValue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No bookings found for the selected period
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">
                          {booking.passengers?.full_name || 'Unknown Passenger'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.pickup_location} → {booking.dropoff_location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(booking.created_at), 'MMM dd, yyyy - HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          ${booking.estimated_price.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
