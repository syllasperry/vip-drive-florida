import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Phone, ArrowLeft } from 'lucide-react';
import { MessagingInterface } from "@/components/MessagingInterface";
import { format } from 'date-fns';

interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type?: string;
  simple_status: 'booking_requested' | 'payment_pending' | 'all_set' | 'completed' | 'cancelled';
  estimated_price?: number;
  final_negotiated_price?: number;
  created_at: string;
  driver_profiles?: {
    full_name: string;
    phone: string;
    profile_photo_url?: string;
    car_make: string;
    car_model: string;
    car_color: string;
    license_plate: string;
  };
}

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      // Check if user is dispatcher - redirect them
      if (user.email === 'syllasperry@gmail.com') {
        navigate('/dispatcher/dashboard');
        return;
      }

      loadBookings(user.id);
      loadPassengerInfo(user.id);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/passenger/login');
    }
  };

  const loadPassengerInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setPassengerInfo(data);
    } catch (error) {
      console.error('Error loading passenger info:', error);
    }
  };

  const loadBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          driver_profiles (
            full_name,
            phone,
            profile_photo_url,
            car_make,
            car_model,
            car_color,
            license_plate
          )
        `)
        .eq('passenger_id', userId)
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
        description: "Failed to load your bookings",
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'Request Submitted';
      case 'payment_pending': return 'Payment Required';
      case 'all_set': return 'All Set - Ready!';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusMessage = (booking: Booking) => {
    switch (booking.simple_status) {
      case 'booking_requested':
        return 'We\'ve received your booking request and are working on confirming your ride. You\'ll be notified once we have a driver and final price.';
      case 'payment_pending':
        return `Your ride is confirmed! The final price is $${booking.final_negotiated_price}. Please complete your payment to finalize the booking.`;
      case 'all_set':
        return 'Payment confirmed! Your ride is all set. Your driver will contact you before pickup.';
      case 'completed':
        return 'Your ride has been completed. Thank you for choosing our service!';
      case 'cancelled':
        return 'This booking has been cancelled. Please contact us if you have any questions.';
      default:
        return 'Status update in progress...';
    }
  };

  const handlePayment = (booking: Booking) => {
    // For now, simulate payment - in production this would integrate with Stripe
    toast({
      title: "Payment Instructions",
      description: "You will receive payment instructions via email shortly.",
    });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (showMessaging && selectedBooking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => setShowMessaging(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <MessagingInterface
            bookingId={selectedBooking.id}
            userType="passenger"
          />
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
              <h1 className="text-2xl font-bold text-foreground">My Bookings</h1>
              <p className="text-muted-foreground">Track and manage your ride requests</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => navigate('/passenger/price-estimate')}>
                New Booking
              </Button>
              <Button 
                variant="outline" 
                onClick={() => supabase.auth.signOut().then(() => navigate('/home'))}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-6">Ready to book your first luxury ride?</p>
            <Button onClick={() => navigate('/passenger/price-estimate')}>
              Book Your First Ride
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Booking #{booking.id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <Badge className={getStatusColor(booking.simple_status)}>
                      {getStatusLabel(booking.simple_status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Message */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">{getStatusMessage(booking)}</p>
                  </div>

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
                    </div>
                  </div>

                  {/* Driver Information (only shown when all_set) */}
                  {booking.simple_status === 'all_set' && booking.driver_profiles && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Your Driver</h4>
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={booking.driver_profiles.profile_photo_url} />
                          <AvatarFallback>{booking.driver_profiles.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{booking.driver_profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.driver_profiles.car_make} {booking.driver_profiles.car_model} 
                            ({booking.driver_profiles.car_color})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            License: {booking.driver_profiles.license_plate}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`tel:${booking.driver_profiles?.phone}`, '_blank')}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Call Driver
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {booking.simple_status === 'booking_requested' 
                          ? `Est. $${booking.estimated_price || 0}`
                          : `$${booking.final_negotiated_price || booking.estimated_price || 0}`
                        }
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowMessaging(true);
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message
                      </Button>

                      {booking.simple_status === 'payment_pending' && (
                        <Button 
                          size="sm"
                          onClick={() => handlePayment(booking)}
                        >
                          Complete Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerDashboard;
