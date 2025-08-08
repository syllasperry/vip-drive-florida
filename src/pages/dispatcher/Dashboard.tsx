
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, Phone, Mail, Car, Calendar, FileText } from 'lucide-react';
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";

interface Booking {
  id: string;
  passenger_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type: string;
  simple_status: string;
  estimated_price: number;
  final_negotiated_price?: number;
  flight_info?: string;
  passengers?: {
    full_name: string;
    email: string;
    phone: string;
    profile_photo_url?: string;
    preferred_temperature?: number;
    music_preference?: string;
    interaction_preference?: string;
    trip_purpose?: string;
    additional_notes?: string;
  };
  created_at: string;
}

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDispatcher, setIsDispatcher] = useState(false);

  useEffect(() => {
    checkDispatcherAccess();
  }, []);

  const checkDispatcherAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        navigate('/passenger/login');
        return;
      }

      // Check if user is the authorized dispatcher
      if (user.email !== 'syllasperry@gmail.com') {
        toast({
          title: "Access Denied",
          description: "You don't have dispatcher privileges.",
          variant: "destructive",
        });
        navigate('/home');
        return;
      }

      setIsDispatcher(true);
      loadBookings();
    } catch (error) {
      console.error('Error checking dispatcher access:', error);
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
            full_name,
            email,
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
      setBookings(data || []);
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

  const getStatusColor = (status: string) => {
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
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isDispatcher) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Checking Access...</h1>
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
              <h1 className="text-2xl font-bold text-foreground">VIP Dispatcher Dashboard</h1>
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
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
            <TabsTrigger value="drivers">Driver Management</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-8">Loading bookings...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium mb-2">No booking requests</h3>
                  <p className="text-muted-foreground">New booking requests will appear here</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id} className="w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={booking.passengers?.profile_photo_url} />
                            <AvatarFallback>
                              {booking.passengers?.full_name?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">
                              {booking.passengers?.full_name || 'Unknown Passenger'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {booking.passengers?.email}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.simple_status)}>
                          {booking.simple_status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
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

                      {/* Passenger Preferences */}
                      {booking.passengers && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Passenger Preferences</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {booking.passengers.preferred_temperature && (
                              <div>Temperature: {booking.passengers.preferred_temperature}°F</div>
                            )}
                            {booking.passengers.music_preference && (
                              <div>Music: {booking.passengers.music_preference}</div>
                            )}
                            {booking.passengers.interaction_preference && (
                              <div>Interaction: {booking.passengers.interaction_preference}</div>
                            )}
                            {booking.passengers.trip_purpose && (
                              <div>Purpose: {booking.passengers.trip_purpose}</div>
                            )}
                            {booking.passengers.additional_notes && (
                              <div className="col-span-2">
                                <strong>Notes:</strong> {booking.passengers.additional_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Flight Info */}
                      {booking.flight_info && (
                        <div className="border-t pt-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium">Flight Information</p>
                              <p className="text-sm text-muted-foreground">{booking.flight_info}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Price Information */}
                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">
                            {booking.final_negotiated_price 
                              ? `$${booking.final_negotiated_price}`
                              : `Est. $${booking.estimated_price || 0}`
                            }
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`tel:${booking.passengers?.phone}`, '_blank')}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`mailto:${booking.passengers?.email}`, '_blank')}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                          <DispatcherBookingManager 
                            booking={booking} 
                            onUpdate={loadBookings}
                          />
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
