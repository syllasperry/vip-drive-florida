
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Download, 
  FileText, 
  Search,
  CreditCard,
  Smartphone,
  Banknote,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface PaymentTransaction {
  id: string;
  booking_id: string;
  passenger_name: string;
  passenger_photo: string;
  driver_name: string;
  amount: number;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transaction_date: string;
  stripe_payment_id?: string;
  dispatcher_commission: number;
  stripe_fee: number;
  driver_net_amount: number;
}

interface PaymentSummary {
  totalReceived: number;
  pendingPayments: number;
  refundsDisputes: number;
}

export const PaymentsSection = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalReceived: 77000,
    pendingPayments: 1280,
    refundsDisputes: 17000
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState("thisweek");

  useEffect(() => {
    loadPaymentData();
  }, [statusFilter, paymentMethodFilter, dateRange]);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'thisweek':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'thismonth':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // Fetch completed bookings with payment data
      let query = supabase
        .from('bookings')
        .select(`
          id,
          final_price,
          estimated_price,
          payment_method,
          payment_confirmation_status,
          pickup_time,
          created_at,
          passengers (
            full_name,
            profile_photo_url
          ),
          drivers (
            full_name
          )
        `)
        .eq('payment_confirmation_status', 'all_set')
        .not('final_price', 'is', null)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const { data: bookings, error } = await query;
      
      if (error) throw error;

      // Transform bookings into payment transactions
      const paymentTransactions: PaymentTransaction[] = (bookings || []).map((booking, index) => {
        const amount = booking.final_price || booking.estimated_price || 0;
        const dispatcherCommission = amount * 0.20; // 20% commission
        const stripeFee = booking.payment_method === 'stripe' ? amount * 0.029 + 0.30 : 0; // Stripe fees
        const driverNetAmount = amount - dispatcherCommission - stripeFee;

        // Sample statuses for demo
        const statuses = ['completed', 'pending', 'failed', 'refunded'] as const;
        const status = index === 0 ? 'pending' : index === 2 ? 'failed' : index === 4 ? 'refunded' : 'completed';

        return {
          id: booking.id,
          booking_id: booking.id,
          passenger_name: booking.passengers?.full_name || 'Unknown Passenger',
          passenger_photo: booking.passengers?.profile_photo_url || '',
          driver_name: booking.drivers?.full_name || 'Unknown Driver',
          amount: amount,
          payment_method: booking.payment_method || 'stripe',
          status: status,
          transaction_date: booking.pickup_time || booking.created_at,
          dispatcher_commission: dispatcherCommission,
          stripe_fee: stripeFee,
          driver_net_amount: driverNetAmount
        };
      });

      // Apply filters
      let filteredTransactions = paymentTransactions;
      
      if (statusFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.status === statusFilter);
      }
      
      if (paymentMethodFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.payment_method === paymentMethodFilter);
      }

      setTransactions(filteredTransactions);

      // Calculate summary based on filtered data
      const totalReceived = filteredTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.dispatcher_commission, 0);
      
      const pendingPayments = filteredTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const refundsDisputes = filteredTransactions
        .filter(t => t.status === 'refunded')
        .reduce((sum, t) => sum + t.amount, 0);

      setSummary({
        totalReceived,
        pendingPayments,
        refundsDisputes
      });

    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'stripe':
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'apple_pay':
      case 'google_pay':
        return <Smartphone className="w-4 h-4" />;
      case 'zelle':
      case 'venmo':
      case 'cash_app':
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodName = (method: string) => {
    switch (method.toLowerCase()) {
      case 'stripe':
        return 'Mastercard';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-500 text-white",
      pending: "bg-yellow-500 text-black",
      failed: "bg-red-500 text-white",
      refunded: "bg-gray-500 text-white"
    };
    
    const labels = {
      completed: "Paid",
      pending: "Pending",
      failed: "Failed",
      refunded: "Refunded"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.completed}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const exportCSV = () => {
    const csvContent = [
      ['Date', 'Passenger', 'Driver', 'Amount', 'Payment Method', 'Commission', 'Stripe Fee', 'Driver Net', 'Status'].join(','),
      ...filteredTransactions.map(t => [
        format(new Date(t.transaction_date), 'yyyy-MM-dd HH:mm'),
        t.passenger_name,
        t.driver_name,
        `$${t.amount.toFixed(2)}`,
        t.payment_method,
        `$${t.dispatcher_commission.toFixed(2)}`,
        `$${t.stripe_fee.toFixed(2)}`,
        `$${t.driver_net_amount.toFixed(2)}`,
        t.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Overview</h1>
          <p className="text-sm text-gray-500">VIP Dispatcher Dashboard</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={dateRange === 'today' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setDateRange('today')}
          >
            Today
          </Button>
          <Button 
            variant={dateRange === 'thisweek' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setDateRange('thisweek')}
          >
            This Week
          </Button>
          <Button 
            variant={dateRange === 'thismonth' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setDateRange('thismonth')}
          >
            This Month
          </Button>
          <Button variant="outline" size="sm">
            Custom Range
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-500 text-white border-0">
          <CardContent className="p-6">
            <div className="text-sm font-medium opacity-90">Total Received</div>
            <div className="text-3xl font-bold">${summary.totalReceived.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500 text-black border-0">
          <CardContent className="p-6">
            <div className="text-sm font-medium opacity-90">Pending Payments</div>
            <div className="text-3xl font-bold">${summary.pendingPayments.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-500 text-white border-0">
          <CardContent className="p-6">
            <div className="text-sm font-medium opacity-90">Refunds/Disputes</div>
            <div className="text-3xl font-bold">${summary.refundsDisputes.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search passengers or drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
              <SelectItem value="apple_pay">Apple Pay</SelectItem>
              <SelectItem value="google_pay">Google Pay</SelectItem>
              <SelectItem value="zelle">Zelle</SelectItem>
              <SelectItem value="venmo">Venmo</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Date</th>
                  <th className="text-left p-4 font-medium text-gray-900">Payment Method</th>
                  <th className="text-left p-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left p-4 font-medium text-gray-900">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                      <p className="text-gray-500">No payment transactions match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={transaction.passenger_photo} />
                            <AvatarFallback>
                              {transaction.passenger_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{transaction.passenger_name}</div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(transaction.transaction_date), 'dd/MM/yyyy HH:mm a')}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(transaction.payment_method)}
                          <span className="text-sm font-medium">
                            {getPaymentMethodName(transaction.payment_method)}
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className={`font-semibold ${
                          transaction.status === 'refunded' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${transaction.amount.toFixed(0)}
                        </div>
                      </td>

                      <td className="p-4">
                        {getStatusBadge(transaction.status)}
                      </td>

                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                          View in Stripe
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
