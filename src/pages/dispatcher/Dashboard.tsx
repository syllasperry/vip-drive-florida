
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
import { MapPin, Clock, Users, DollarSign, Car, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Booking } from "@/types/booking";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (rideStatus === 'offer_sent' || status === 'offer_sent') return 'payment_pending';
    return 'booking_requested';
  };

  const getStatusColor = (status: Booking['simple_status']) => {
    switch (status) {
      case 'booking_requested': return 'bg-yellow-100 text-yellow-800';
      case 'payment_pending': return 'bg-blue-100 text-blue-800';
      case 'all_set': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dispatcher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dispatcher Dashboard</h1>
              <p className="text-muted-foreground">Manage all bookings, drivers, and payments</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => supabase.auth.signOut().then(() => navigate('/home'))}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <div className="grid gap-6">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground">New booking requests will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Booking #{booking.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(booking.simple_status)}>
                            {booking.simple_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <DispatcherBookingManager 
                            booking={booking} 
                            onUpdate={loadBookings}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Passenger Info */}
                      {booking.passengers && (
                        <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={booking.passengers.profile_photo_url} />
                            <AvatarFallback>{booking.passengers.full_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{booking.passengers.full_name}</h4>
                            {booking.passengers.phone && (
                              <p className="text-sm text-muted-foreground flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {booking.passengers.phone}
                              </p>
                            )}
                            {booking.passengers.preferred_temperature && (
                              <p className="text-xs text-muted-foreground">
                                Temp: {booking.passengers.preferred_temperature}°C
                              </p>
                            )}
                            {booking.passengers.music_preference && (
                              <p className="text-xs text-muted-foreground">
                                Music: {booking.passengers.music_preference}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Trip Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Pickup</p>
                              <p className="text-sm text-muted-foreground">{booking.pickup_location}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Drop-off</p>
                              <p className="text-sm text-muted-foreground">{booking.dropoff_location}</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">Date & Time</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDateTime(booking.pickup_time)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="text-sm">{booking.passenger_count} passenger(s)</span>
                          </div>
                          {booking.vehicle_type && (
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-gray-600" />
                              <span className="text-sm">{booking.vehicle_type}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            ${booking.estimated_price || 0}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDateTime(booking.created_at)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="drivers">
            <DriverManagement />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentCalculator />
          </TabsContent>

          <TabsContent value="messages">
            <DispatcherMessaging />
          </TabsContent>

          <TabsContent value="reports">
            <FinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
