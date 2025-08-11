
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, MapPin, Clock, Users, Car, DollarSign } from "lucide-react";

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dispatcherInfo, setDispatcherInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings");
  const [topNavTab, setTopNavTab] = useState("Bookings");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/dispatcher/login');
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
    } catch (error) {
      console.error('🔒 Auth error:', error);
      navigate('/dispatcher/login');
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
            profile_photo_url
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/dispatcher/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case "drivers":
        navigate('/dispatcher/drivers');
        break;
      case "payments":
        navigate('/dispatcher/payments');
        break;
      case "messages":
        navigate('/dispatcher/messages');
        break;
      case "settings":
        navigate('/dispatcher/settings');
        break;
      default:
        break;
    }
  };

  const topNavTabs = ["Bookings", "Drivers", "Payments", "Messages", "Reports"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offer_sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-semibold text-gray-900">
              Booking ID #{booking.id.slice(-8).toUpperCase()}
            </div>
            <Badge className={`text-xs px-2 py-1 border ${getStatusColor(booking.status)}`}>
              {booking.status === 'pending' ? 'New Request' : booking.status}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-orange-500">
              ${booking.final_price || booking.estimated_price || '0'}
            </div>
          </div>
        </div>

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

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
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

        {!booking.driver_id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2">
              <div className="text-yellow-600 text-xs">⚠️</div>
              <div className="text-xs text-yellow-700 font-medium">
                Driver requires manual assignment by dispatcher
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            🚗 Uber Price Estimate
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="px-4"
          >
            ⚙️ Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-4">
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

          {/* Top Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {topNavTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setTopNavTab(tab)}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  topNavTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-4 pb-20">
        {topNavTab === "Bookings" && (
          <>
            {/* Driver Assignment Section */}
            <Card className="mb-6 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Assign Driver to Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <DispatcherBookingManager onUpdate={loadBookings} />
              </CardContent>
            </Card>

            {/* All Bookings */}
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
          </>
        )}

        {topNavTab === "Drivers" && (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Driver Management</h3>
              <p className="text-gray-600">Manage driver profiles and availability</p>
            </CardContent>
          </Card>
        )}

        {topNavTab === "Payments" && (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Payment Overview</h3>
              <p className="text-gray-600">Track payments and financial reports</p>
            </CardContent>
          </Card>
        )}

        {topNavTab === "Messages" && (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Messages</h3>
              <p className="text-gray-600">Communicate with drivers and passengers</p>
            </CardContent>
          </Card>
        )}

        {topNavTab === "Reports" && (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Reports</h3>
              <p className="text-gray-600">View analytics and performance reports</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userType="dispatcher"
        pendingActionsCount={bookings.filter(b => !b.driver_id).length}
        hasActiveRide={false}
      />
    </div>
  );
};

export default DispatcherDashboard;
