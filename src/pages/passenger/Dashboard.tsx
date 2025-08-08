import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Phone, ArrowLeft, Car, CreditCard, Settings } from 'lucide-react';
import { MessagingInterface } from "@/components/MessagingInterface";
import { format } from 'date-fns';
import { Booking } from "@/types/booking";

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings");

  useEffect(() => {
    checkAuth();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('passenger-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Real-time booking update for passenger:', payload);
          // Refresh bookings when changes occur
          const { data: { user } } = supabase.auth.getUser();
          if (user?.user) {
            loadBookings(user.user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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
          drivers (
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

      // Map the data to match our Booking interface
      const mappedBookings: Booking[] = (data || []).map(booking => ({
        id: booking.id,
        pickup_location: booking.pickup_location,
        dropoff_location: booking.dropoff_location,
        pickup_time: booking.pickup_time,
        passenger_count: booking.passenger_count,
        vehicle_type: booking.vehicle_type,
        simple_status: mapToSimpleStatus(booking.status, booking.ride_status, booking.payment_confirmation_status),
        estimated_price: booking.estimated_price,
        final_negotiated_price: booking.final_price,
        final_price: booking.final_price,
        created_at: booking.created_at,
        passenger_id: booking.passenger_id,
        driver_id: booking.driver_id,
        status: booking.status,
        ride_status: booking.ride_status,
        payment_confirmation_status: booking.payment_confirmation_status,
        driver_profiles: booking.drivers ? {
          full_name: booking.drivers.full_name,
          phone: booking.drivers.phone,
          profile_photo_url: booking.drivers.profile_photo_url,
          car_make: booking.drivers.car_make,
          car_model: booking.drivers.car_model,
          car_color: booking.drivers.car_color,
          license_plate: booking.drivers.license_plate
        } : undefined
      }));

      console.log('📊 Passenger loaded bookings:', mappedBookings);
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
    console.log('Passenger mapping status:', { status, rideStatus, paymentStatus });
    
    if (status === 'completed' || rideStatus === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    
    // Check for All Set status
    if (paymentStatus === 'all_set' || rideStatus === 'all_set') return 'all_set';
    
    // Check for Offer Price Sent status - agora com trigger SQL funcionando
    if (status === 'offer_sent' || rideStatus === 'offer_sent' || paymentStatus === 'waiting_for_payment') {
      return 'payment_pending';
    }
    
    return 'booking_requested';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'payment_pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'all_set': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booking_requested': return 'Booking Requested';
      case 'payment_pending': return 'Offer Price Sent';
      case 'all_set': return 'All Set';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handlePayment = (booking: Booking) => {
    // Placeholder for Stripe payment integration
    toast({
      title: "Payment Processing",
      description: `Processing payment of $${booking.final_price || booking.estimated_price}`,
    });
    
    // TODO: Integrate with Stripe checkout here
    // For now, simulate payment completion
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: "Your booking is now confirmed!",
      });
    }, 2000);
  };

  const handleCall = () => {
    // Call dispatcher instead of driver
    window.open('tel:+1234567890', '_blank');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (showMessaging && selectedBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setShowMessaging(false)}
              className="p-0 h-auto text-gray-600"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Bookings
            </Button>
          </div>
          <MessagingInterface
            bookingId={selectedBooking.id}
            userType="passenger"
            isOpen={true}
            onClose={() => setShowMessaging(false)}
            currentUserId={selectedBooking.passenger_id}
            currentUserName="Passenger"
          />
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
            <h1 className="text-xl font-semibold text-gray-900">My Bookings</h1>
            <Button 
              onClick={() => navigate('/passenger/price-estimate')}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-6 pb-24">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-6">Ready to book your first luxury ride?</p>
            <Button 
              onClick={() => navigate('/passenger/price-estimate')}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              Book Your First Ride
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">Booking ID</span>
                      <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.simple_status)}`}>
                        {getStatusLabel(booking.simple_status)}
                      </Badge>
                    </div>
                    <Clock className="w-4 h-4 text-gray-400" />
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

                  {/* Trip Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {formatDateTime(booking.pickup_time)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {booking.passenger_count} passengers
                      </span>
                    </div>
                    {booking.vehicle_type && (
                      <div className="flex items-center space-x-2 col-span-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{booking.vehicle_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Price - show final_price if available, otherwise estimated_price */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-red-600">
                      ${booking.final_price || booking.estimated_price || 0}
                    </span>
                  </div>

                  {/* Driver Information - show different info based on status */}
                  {booking.simple_status === 'payment_pending' && booking.driver_profiles && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Your Assigned Driver</p>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.driver_profiles.profile_photo_url} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {booking.driver_profiles.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{booking.driver_profiles.full_name}</p>
                          <p className="text-sm text-gray-500">
                            {booking.driver_profiles.car_make} {booking.driver_profiles.car_model}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Driver Information (only shown when all_set) */}
                  {booking.simple_status === 'all_set' && booking.driver_profiles && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">Your Driver</p>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={booking.driver_profiles.profile_photo_url} />
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            {booking.driver_profiles.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{booking.driver_profiles.full_name}</p>
                          <p className="text-sm text-gray-500">{booking.driver_profiles.phone}</p>
                          <p className="text-sm text-gray-500">
                            {booking.driver_profiles.car_make} {booking.driver_profiles.car_model} 
                            ({booking.driver_profiles.car_color})
                          </p>
                          <p className="text-sm text-gray-500">
                            License: {booking.driver_profiles.license_plate}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowMessaging(true);
                      }}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCall}
                      className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => {
                        toast({
                          title: "View Details",
                          description: "Detailed view coming soon",
                        });
                      }}
                    >
                      View Details
                    </Button>
                  </div>

                  {/* Payment Button for Offer Price Sent status */}
                  {booking.simple_status === 'payment_pending' && (
                    <Button 
                      className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white"
                      onClick={() => handlePayment(booking)}
                    >
                      Pay ${booking.final_price || booking.estimated_price} - Complete Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 py-2">
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
              onClick={() => setActiveTab("messages")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "messages" ? "text-red-600" : "text-gray-400"
              }`}
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">Messages</span>
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
              onClick={() => setActiveTab("settings")}
              className={`flex flex-col items-center py-2 px-1 ${
                activeTab === "settings" ? "text-red-600" : "text-gray-400"
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

export default PassengerDashboard;
