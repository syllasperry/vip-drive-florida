import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, Car, Phone, MessageCircle, BarChart3, Settings, UserCheck, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from "@/types/booking";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== 'syllasperry@gmail.com') {
        navigate('/home');
        return;
      }

      loadBookings();
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/home');
    }
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            id,
            full_name,
            phone,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to include simple_status based on existing status
      const mappedBookings = (data || []).map(booking => ({
        ...booking,
        simple_status: mapToSimpleStatus(booking.status, booking.ride_status, booking.payment_confirmation_status),
        final_negotiated_price: booking.estimated_price
      })) as Booking[];

      setBookings(mappedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mapToSimpleStatus = (status?: string, rideStatus?: string, paymentStatus?: string): Booking['simple_status'] => {
    if (status === 'completed' || rideStatus === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    if (paymentStatus === 'all_set' || rideStatus === 'all_set') return 'all_set';
    if (rideStatus === 'offer_sent' || status === 'offer_sent' || paymentStatus === 'waiting_for_payment') return 'payment_pending';
    return 'booking_requested';
  };

  const getStatusColor = (status: Booking['simple_status']) => {
    switch (status) {
      case 'booking_requested': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'payment_pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'all_set': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Booking['simple_status']) => {
    switch (status) {
      case 'booking_requested': return 'Booking Requested';
      case 'payment_pending': return 'Offer Price Sent';
      case 'all_set': return 'All Set';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  const navigateToUberEstimate = () => {
    window.open('/passenger/price-estimate', '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dispatcher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Dispatcher Dashboard</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => supabase.auth.signOut().then(() => navigate('/home'))}
              className="text-gray-600 border-gray-300"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
            <TabsList className="grid w-full grid-cols-5 h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="bookings" 
                className="flex-1 py-4 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 rounded-none"
              >
                Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="drivers"
                className="flex-1 py-4 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 rounded-none"
              >
                Drivers
              </TabsTrigger>
              <TabsTrigger 
                value="payments"
                className="flex-1 py-4 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 rounded-none"
              >
                Payments
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                className="flex-1 py-4 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 rounded-none"
              >
                Messages
              </TabsTrigger>
              <TabsTrigger 
                value="reports"
                className="flex-1 py-4 text-xs font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 rounded-none"
              >
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6 pb-24">
            <TabsContent value="bookings" className="mt-0 space-y-4">
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Car className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-500">New booking requests will appear here</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            Booking ID
                          </span>
                          <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.simple_status)}`}>
                            {getStatusLabel(booking.simple_status)}
                          </Badge>
                        </div>
                        <DispatcherBookingManager booking={booking} onUpdate={loadBookings} />
                      </div>

                      {/* Booking ID */}
                      <div className="text-lg font-semibold text-gray-900 mb-4">
                        #{booking.id.slice(-8).toUpperCase()}
                      </div>

                      {/* Locations with vector icons */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm text-gray-500">Pickup</p>
                            <p className="text-sm font-medium text-gray-900">{booking.pickup_location}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <p className="text-sm text-gray-500">Drop-off</p>
                            <p className="text-sm font-medium text-gray-900">{booking.dropoff_location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {formatDateTime(booking.pickup_time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {booking.passenger_count} passengers
                          </span>
                        </div>
                        {booking.vehicle_type && (
                          <div className="flex items-center space-x-2 col-span-2">
                            <Car className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{booking.vehicle_type}</span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-red-600">
                          ${booking.final_price || booking.estimated_price || 0}
                        </span>
                        {booking.simple_status === 'booking_requested' && (
                          <Button 
                            onClick={navigateToUberEstimate}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            Uber Price Estimate
                          </Button>
                        )}
                      </div>

                      {/* Passenger Info */}
                      {booking.passengers && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={booking.passengers.profile_photo_url} />
                              <AvatarFallback className="bg-gray-200 text-gray-600">
                                {booking.passengers.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{booking.passengers.full_name}</p>
                              {booking.passengers.phone && (
                                <p className="text-sm text-gray-500">{booking.passengers.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="drivers" className="mt-0">
              <DriverManagement />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentCalculator />
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <DispatcherMessaging />
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <FinancialReports />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-5 py-2">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "bookings" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <Car className="w-5 h-5 mb-1" />
              <span className="text-xs">Bookings</span>
            </button>
            <button
              onClick={() => setActiveTab("drivers")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "drivers" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <UserCheck className="w-5 h-5 mb-1" />
              <span className="text-xs">Drivers</span>
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "payments" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1" />
              <span className="text-xs">Payments</span>
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "messages" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Messages</span>
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "reports" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
