
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Car, 
  Users, 
  Clock, 
  DollarSign, 
  Search, 
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  Phone,
  User
} from "lucide-react";
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { getDispatcherBookings, type DispatcherBookingData } from "@/lib/api/bookings";

const DispatcherDashboard = () => {
  const [bookings, setBookings] = useState<DispatcherBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDispatcherBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading dispatcher bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
      case 'all_set':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'TBD';
    return `$${price.toFixed(2)}`;
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchTerm || 
      booking.passenger_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalBookings: bookings.length,
    activeDrivers: new Set(bookings.filter(b => b.driver_name).map(b => b.driver_name)).size,
    pendingRides: bookings.filter(b => b.status === 'pending').length,
    completedToday: bookings.filter(b => {
      const today = new Date().toDateString();
      return b.status === 'completed' && new Date(b.created_at).toDateString() === today;
    }).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VIP Dispatcher Dashboard</h1>
              <p className="text-gray-600">Manage rides, drivers, and operations</p>
            </div>
            <Button onClick={loadBookings} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold">{stats.activeDrivers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending Rides</p>
                  <p className="text-2xl font-bold">{stats.pendingRides}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by passenger, driver, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="all_set">All Set</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bookings List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings ({filteredBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-6">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={loadBookings} variant="outline">
                      Try Again
                    </Button>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-6">
                    <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No bookings match your criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                      <div key={booking.booking_id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(booking.status)}>
                              {booking.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatPrice(booking.final_price || booking.estimated_price)}
                            </div>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{booking.pickup_location}</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{booking.dropoff_location}</div>
                            </div>
                          </div>
                        </div>

                        {/* Passenger Info */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-900">Passenger</span>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">{booking.passenger_name}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {booking.passenger_phone}
                            </div>
                          </div>
                        </div>

                        {/* Driver Info */}
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Car className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-900">Driver</span>
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {booking.driver_name || "No driver assigned"}
                            </div>
                            {booking.driver_phone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3 w-3" />
                                {booking.driver_phone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDateTime(booking.pickup_time)}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Booked on {formatDateTime(booking.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drivers">
            <DriverManagement />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsSection />
          </TabsContent>

          <TabsContent value="messages">
            <DispatcherMessaging />
          </TabsContent>

          <TabsContent value="settings">
            <DispatcherSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
