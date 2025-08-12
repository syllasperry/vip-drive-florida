// === NEW IMPORTS (add these) ===
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PassengerPreferencesCard } from "@/components/passenger/PassengerPreferencesCard";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAllBookings, listenForBookingChanges } from "../../data/bookings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Phone, ArrowLeft, Car, CreditCard, Settings } from 'lucide-react';
import { MessagingInterface } from "@/components/MessagingInterface";
import { format } from 'date-fns';
import { Booking } from "@/types/booking";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { mapToSimpleStatus } from "@/utils/bookingHelpers";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PassengerPreferencesCard } from "@/components/passenger/PassengerPreferencesCard";
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
  async function fetchBookings() {
    const allBookings = await getAllBookings();
    setBookings(allBookings);
  }
const [passengerProfile, setPassengerProfile] = useState<any | null>(null);
  fetchBookings();
const [passengerProfile, setPassengerProfile] = useState<any | null>(null);

async function loadPassengerProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("passengers")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    setPassengerProfile(data);
  } catch (err) {
    console.error("Error loading passenger profile:", err);
  }
}
  // Escuta em tempo real alterações nos bookings
  const unsubscribe = listenForBookingChanges((updatedBooking) => {
    setBookings((prevBookings) => {
      const index = prevBookings.findIndex(b => b.id === updatedBooking.id);
      if (index !== -1) {
        const newBookings = [...prevBookings];
        newBookings[index] = updatedBooking;
        return newBookings;
      } else {
        return [...prevBookings, updatedBooking];
      }
    });
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);
  useEffect(() => {
    checkAuth();
    setupRealtimeSubscription();
    
    // Enhanced auto-refresh with better synchronization
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing passenger dashboard for status sync...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await loadBookings(user.id);
        }
      } catch (error) {
        console.error('❌ Error in auto-refresh:', error);
      }
    }, 2000); // Reduced to 2 seconds for better real-time feel

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('passenger-bookings-realtime-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        async (payload) => {
          console.log('📡 Enhanced real-time booking update for passenger:', payload);
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Force immediate refresh with full reload
            console.log('🔄 Force refreshing passenger dashboard due to real-time update');
            loadBookings(user.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Enhanced passenger realtime subscription status:', status);
      });

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
// Carrega foto/nome/preferências do passageiro autenticado
await loadPassengerProfile(user.id);
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
      console.log('🔄 Loading bookings for passenger with enhanced sync:', userId);
      
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

      const mappedBookings: Booking[] = (data || []).map(booking => {
        console.log('📋 Processing passenger booking with enhanced status detection:', {
          id: booking.id,
          status: booking.status,
          ride_status: booking.ride_status,
          payment_confirmation_status: booking.payment_confirmation_status,
          final_price: booking.final_price,
          estimated_price: booking.estimated_price,
          driver_id: booking.driver_id
        });

        return {
          id: booking.id,
          pickup_location: booking.pickup_location,
          dropoff_location: booking.dropoff_location,
          pickup_time: booking.pickup_time,
          passenger_count: booking.passenger_count,
          vehicle_type: booking.vehicle_type,
          simple_status: mapToSimpleStatus(booking),
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
        };
      });

      console.log('📊 Passenger bookings loaded with enhanced sync:', mappedBookings.length);
      setBookings(mappedBookings);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      case 'payment_pending': return 'Offer Received - Review & Pay';
      case 'all_set': return 'All Set';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const handlePayment = (booking: Booking) => {
    toast({
      title: "Payment Processing",
      description: `Processing payment of $${booking.final_price || booking.estimated_price}`,
    });
    
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: "Your booking is now confirmed!",
      });
    }, 2000);
  };

  const handleCall = () => {
    window.open('tel:+1234567890', '_blank');
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy - HH:mm');
  };

  const getCurrentPrice = (booking: Booking): number | null => {
    // Enhanced price display: Show final_price if offer sent by dispatcher, otherwise null (awaiting price)
    if (booking.final_price && booking.final_price > 0) {
      console.log('💰 Showing dispatcher offer price:', booking.final_price);
      return booking.final_price;
    }
    console.log('💰 No dispatcher price set yet - awaiting price');
    return null;
  };

  const getPriceDisplay = (booking: Booking): string => {
    const currentPrice = getCurrentPrice(booking);
    if (currentPrice !== null) {
      return `$${currentPrice}`;
    }
    return "Awaiting price";
  };

  const getPriceColor = (booking: Booking): string => {
    const currentPrice = getCurrentPrice(booking);
    if (currentPrice !== null) {
      return "text-red-600"; // Show price in red when set by dispatcher
    }
    return "text-gray-500"; // Show "Awaiting price" in gray
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

  const renderTabContent = () => {
    const currentUser = passengerInfo || { id: '', full_name: 'Passenger' };
    
    switch (activeTab) {
      case "messages":
        return <MessagesTab bookings={bookings} currentUserId={currentUser.id} currentUserName={currentUser.full_name} />;
      case "payments":
        return <PaymentsTab bookings={bookings} />;
      case "settings":
        return <SettingsTab passengerInfo={passengerInfo} />;
      default:
        return (
          <div className="space-y-4">
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
              bookings.map((booking) => (
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

                    {/* Enhanced Price Display - Show dispatcher price or "Awaiting price" */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-2xl font-bold ${getPriceColor(booking)}`}>
                        {getPriceDisplay(booking)}
                      </span>
                      {booking.simple_status === 'payment_pending' && getCurrentPrice(booking) !== null && (
                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
                          Offer Received
                        </Badge>
                      )}
                      {getCurrentPrice(booking) === null && (
                        <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-600">
                          Pending Quote
                        </Badge>
                      )}
                    </div>

                    {/* Enhanced Driver Information - show when offer is sent by dispatcher */}
                    {booking.simple_status === 'payment_pending' && booking.driver_profiles && getCurrentPrice(booking) !== null && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 mb-2">Your Assigned Driver</p>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={booking.driver_profiles.profile_photo_url} />
                            <AvatarFallback className="bg-blue-200 text-blue-800">
                              {booking.driver_profiles.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">{booking.driver_profiles.full_name}</p>
                            <p className="text-sm text-blue-700">
                              {booking.driver_profiles.car_make} {booking.driver_profiles.car_model}
                            </p>
                            <p className="text-sm text-blue-600">
                              {booking.driver_profiles.car_color} • {booking.driver_profiles.license_plate}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Full Driver Information (only shown when all_set) */}
                    {booking.simple_status === 'all_set' && booking.driver_profiles && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
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

                    {/* Enhanced Payment Button for payment_pending status - only show when price is set */}
                    {booking.simple_status === 'payment_pending' && getCurrentPrice(booking) !== null && (
                      <Button 
                        className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handlePayment(booking)}
                      >
                        Pay ${getCurrentPrice(booking)} - Complete Booking
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        );
    }
  };
{/* Passenger Booking Summary */}
<div className="bg-white rounded-lg shadow p-4 mb-4">
  <h2 className="text-lg font-semibold text-gray-800 mb-2">
    Booking Summary
  </h2>
  {selectedBooking ? (
    <div className="space-y-2">
      <div className="flex items-center">
        <img
          src={selectedBooking.passenger_photo || "/default-avatar.png"}
          alt="Passenger"
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <p className="font-medium text-gray-900">
            {selectedBooking.passenger_name || "Unknown Passenger"}
          </p>
          <p className="text-sm text-gray-500">
            {selectedBooking.passenger_phone || "No phone available"}
          </p>
        </div>
      </div>
      <div className="text-sm text-gray-700">
        <p><strong>Pickup:</strong> {selectedBooking.pickup_location}</p>
        <p><strong>Drop-off:</strong> {selectedBooking.dropoff_location}</p>
        <p><strong>Status:</strong> {selectedBooking.simple_status}</p>
      </div>
    </div>
  ) : (
    <p className="text-sm text-gray-500">No booking selected</p>
  )}
</div>
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {activeTab === "bookings" && "My Bookings"}
              {activeTab === "messages" && "Messages"}
              {activeTab === "payments" && "Payments"}
              {activeTab === "settings" && "Settings"}
            </h1>
            {activeTab === "bookings" && (
              <Button 
                onClick={() => navigate('/passenger/price-estimate')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                New Booking
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-6 pb-24">
        {renderTabContent()}
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
