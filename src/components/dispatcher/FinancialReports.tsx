
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";

export const FinancialReports = () => {
  const { toast } = useToast();
  const [reportPeriod, setReportPeriod] = useState('current_month');
  const [reportData, setReportData] = useState({
    totalRides: 0,
    totalRevenue: 0,
    totalCommission: 0,
    totalDriverPayouts: 0,
    totalStripeFees: 0,
    recentBookings: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [reportPeriod]);

  const getDateRange = () => {
    const now = new Date();
    switch (reportPeriod) {
      case 'current_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'current_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Load completed bookings for the period
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (full_name, email),
          driver_profiles (full_name)
        `)
        .eq('simple_status', 'completed')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate totals
      let totalRevenue = 0;
      let totalCommission = 0;
      let totalDriverPayouts = 0;
      let totalStripeFees = 0;

      bookings.forEach((booking: any) => {
        const price = booking.final_negotiated_price || booking.estimated_price || 0;
        const commissionRate = booking.commission_rate || 20;
        const stripeFeeRate = booking.stripe_fee_rate || 2.9;
        
        totalRevenue += price;
        
        if (booking.payment_method === 'stripe' || booking.payment_method === 'apple_pay' || booking.payment_method === 'google_pay') {
          totalStripeFees += price * (stripeFeeRate / 100);
        }
        
        totalCommission += price * (commissionRate / 100);
        totalDriverPayouts += price - (price * (commissionRate / 100)) - (price * (stripeFeeRate / 100));
      });

      setReportData({
        totalRides: bookings.length,
        totalRevenue,
        totalCommission,
        totalDriverPayouts,
        totalStripeFees,
        recentBookings: bookings.slice(0, 10) // Show last 10 bookings
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // Generate CSV content
    const csvContent = [
      ['VIP Service Financial Report'],
      ['Period', getPeriodLabel()],
      ['Generated', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      [''],
      ['Summary'],
      ['Total Rides', reportData.totalRides],
      ['Total Revenue', `$${reportData.totalRevenue.toFixed(2)}`],
      ['Total Commission', `$${reportData.totalCommission.toFixed(2)}`],
      ['Total Driver Payouts', `$${reportData.totalDriverPayouts.toFixed(2)}`],
      ['Total Stripe Fees', `$${reportData.totalStripeFees.toFixed(2)}`],
      [''],
      ['Recent Bookings'],
      ['Date', 'Passenger', 'Driver', 'Route', 'Price', 'Commission', 'Status']
    ];

    reportData.recentBookings.forEach((booking: any) => {
      csvContent.push([
        format(new Date(booking.created_at), 'yyyy-MM-dd'),
        booking.passengers?.full_name || 'Unknown',
        booking.driver_profiles?.full_name || 'Not assigned',
        `${booking.pickup_location} → ${booking.dropoff_location}`,
        `$${(booking.final_negotiated_price || booking.estimated_price || 0).toFixed(2)}`,
        `$${((booking.final_negotiated_price || booking.estimated_price || 0) * ((booking.commission_rate || 20) / 100)).toFixed(2)}`,
        booking.simple_status
      ]);
    });

    // Convert to CSV string
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    
    // Download file
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `vip-financial-report-${getPeriodLabel()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Success",
      description: "Report exported successfully",
    });
  };

  const getPeriodLabel = () => {
    switch (reportPeriod) {
      case 'current_month':
        return format(new Date(), 'MMMM yyyy');
      case 'last_month':
        return format(subMonths(new Date(), 1), 'MMMM yyyy');
      case 'current_year':
        return format(new Date(), 'yyyy');
      default:
        return 'Current Month';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">Track earnings, commissions, and financial performance</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="current_year">Current Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={exportReport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{reportData.totalRides}</p>
                <p className="text-sm text-muted-foreground">Total Rides</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">${reportData.totalCommission.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">My Commission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">${reportData.totalDriverPayouts.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Driver Payouts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading report data...</div>
          ) : reportData.recentBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed rides for this period
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{booking.passengers?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p>{booking.pickup_location}</p>
                        <p className="text-muted-foreground">→ {booking.dropoff_location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">
                        ${(booking.final_negotiated_price || booking.estimated_price || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Commission: ${((booking.final_negotiated_price || booking.estimated_price || 0) * ((booking.commission_rate || 20) / 100)).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {booking.simple_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
