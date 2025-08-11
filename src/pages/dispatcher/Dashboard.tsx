
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { BookingManagementModal } from "@/components/dispatcher/BookingManagementModal";
import { PassengerPreferencesCard } from "@/components/passenger/PassengerPreferencesCard";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Clock, Users, Car, MapPin, Phone, Mail } from "lucide-react";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dispatcherInfo, setDispatcherInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showManagementModal, setShowManagementModal] = useState(false);

  useEffect(() => {
    checkAuth();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dispatcher-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Dispatcher dashboard real-time update:', payload);
          loadBookings();
        }
      )
      .subscribe((status) => {
        console.log('📡 Dispatcher realtime subscription status:', status);
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

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'dispatcher')
        .single();

      if (roleError || !userRole) {
        console.log('🔒 Access denied: User does not have dispatcher role');
        navigate('/passenger/dashboard');
        return;
      }

      loadDispatcherInfo(user.id);
      loadBookings();
      loadDrivers();
    } catch (error) {
      console.error('🔒 Auth error:', error);
      navigate('/passenger/login');
    }
  };

  const loadDispatcherInfo = async (userId: string) => {
    try {
      const { data: dispatcherData, error: dispatcherError } = await supabase
        .from('dispatchers')
        .select('*')
        .eq('id', userId)
        .single();

      if (dispatcherData) {
        setDispatcherInfo(dispatcherData);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDispatcherInfo({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Dispatcher',
          email: user.email,
          phone: user.user_metadata?.phone,
          profile_photo_url: user.user_metadata?.avatar_url
        });
      }
    } catch (error) {
      console.error('Error loading dispatcher info:', error);
      toast({
        title: "Error",
        description: "Failed to load your profile information",
        variant: "destructive",
      });
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers!inner(
            id,
            full_name,
            phone,
            email,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          ),
          drivers(
            full_name,
            phone,
            profile_photo_url,
            car_make,
            car_model,
            car_color,
            license_plate
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

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const cleanupAuthState = () => {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
      };

      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      navigate('/');
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      navigate('/');
      
      toast({
        title: "Signed out",
        description: "Session cleared",
        variant: "destructive",
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const getStatusColor = (booking: any) => {
    const status = booking.status || booking.ride_status;
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'offer_sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (booking: any) => {
    const status = booking.status || booking.ride_status;
    switch (status) {
      case 'pending': return 'Booking Requested';
      case 'offer_sent': return 'Offer Sent';
      case 'accepted': return 'Accepted';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Pending';
    }
  };

  const handleManageBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowManagementModal(true);
  };

  const getCurrentPrice = (booking: any): number | null => {
    if (booking.final_price && booking.final_price > 0) {
      return booking.final_price;
    }
    return null;
  };

  const getPriceDisplay = (booking: any): string => {
    const currentPrice = getCurrentPrice(booking);
    if (currentPrice !== null) {
      return `$${currentPrice}`;
    }
    return "Awaiting price";
  };

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header with Passenger Info and Status */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={booking.passengers?.profile_photo_url} />
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {booking.passengers?.full_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-sm">
                Booking ID #{booking.id.slice(-8).toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">
                {booking.passengers?.full_name}
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {booking.passengers?.phone && (
                  <a href={`tel:${booking.passengers.phone}`} className="flex items-center hover:text-blue-600">
                    <Phone className="h-3 w-3 mr-1" />
                    {booking.passengers.phone}
                  </a>
                )}
                {booking.passengers?.email && (
                  <a href={`mailto:${booking.passengers.email}`} className="flex items-center hover:text-blue-600">
                    <Mail className="h-3 w-3 mr-1" />
                    {booking.passengers.email}
                  </a>
                )}
              </div>
            </div>
          </div>
          <Badge className={`text-xs px-2 py-1 border ${getStatusColor(booking)}`}>
            {getStatusLabel(booking)}
          </Badge>
        </div>

        {/* Trip Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Pickup</div>
              <div className="text-gray-600">{booking.pickup_location}</div>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Drop-off</div>
              <div className="text-gray-600">{booking.dropoff_location}</div>
            </div>
          </div>
        </div>

        {/* Trip Info Row */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(booking.pickup_time).toLocaleDateString()} - {new Date(booking.pickup_time).toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>{booking.passenger_count || 1} passengers</span>
          </div>
          <div className="flex items-center space-x-1">
            <Car className="h-3 w-3" />
            <span>{booking.vehicle_type || 'Tesla Model Y'}</span>
          </div>
        </div>

        {/* Passenger Preferences */}
        {booking.passenger_preferences && (
          <div className="mb-3">
            <PassengerPreferencesCard 
              preferences={booking.passenger_preferences}
              className="justify-start"
            />
          </div>
        )}

        {/* Price Display */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-red-600">
            {getPriceDisplay(booking)}
          </span>
          {booking.status === 'offer_sent' && (
            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-800">
              Offer Sent
            </Badge>
          )}
        </div>

        {/* Driver Info (if assigned) */}
        {booking.drivers && (
          <div className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={booking.drivers.profile_photo_url} />
              <AvatarFallback>{booking.drivers.full_name?.charAt(0) || 'D'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium text-sm">{booking.drivers.full_name}</div>
              <div className="text-xs text-gray-500">
                {booking.drivers.car_make} {booking.drivers.car_model} • {booking.drivers.license_plate}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => handleManageBooking(booking)}
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "drivers":
        return <DriverManagement />;
      case "payments":
        return <FinancialReports />;
      case "messages":
        return <DispatcherMessaging />;
      case "settings":
        return <DispatcherSettings />;
      case "bookings":
      default:
        return (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Bookings</h2>
            <div className="text-sm text-gray-600 mb-4">
              Manage ride requests and assignments
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No bookings found</div>
            ) : (
              <div className="space-y-4">
                {bookings.map(renderBookingCard)}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">VIP Dispatcher Dashboard</h1>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-4 pb-20">
        {renderContent()}
      </div>

      {/* Management Modal */}
      <BookingManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        booking={selectedBooking}
        drivers={drivers}
        onUpdate={loadBookings}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="dispatcher"
        pendingActionsCount={bookings.filter(b => !b.driver_id).length}
        hasActiveRide={false}
      />
    </div>
  );
};

export default DispatcherDashboard;
