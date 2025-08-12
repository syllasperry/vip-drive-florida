
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAllBookings, listenForBookingChanges } from "../../data/bookings";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Users, DollarSign, Settings, MessageCircle, Phone, Car } from 'lucide-react';
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { BookingManagementModal } from "@/components/dispatcher/BookingManagementModal";
import { format } from 'date-fns';

const DispatcherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "drivers" | "messages" | "settings" | "payments">("bookings");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadInitialData();

    // Setup realtime subscription with proper cleanup
    const cleanup = listenForBookingChanges((payload: any) => {
      const { eventType, new: n, old: o } = payload;
      setBookings((prev) => {
        if (eventType === "INSERT" && n) return [n, ...prev];
        if (eventType === "UPDATE" && n) return prev.map(b => b.id === n.id ? n : b);
        if (eventType === "DELETE" && o) return prev.filter(b => b.id !== o.id);
        return prev;
      });
    });

    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      if (user.email !== 'syllasperry@gmail.com') {
        navigate('/passenger/dashboard');
        return;
      }
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/passenger/login');
    }
  };

  const loadInitialData = async () => {
    try {
      await Promise.all([loadBookings(), loadDrivers()]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading all bookings for dispatcher...');
      
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
          ),
          passengers (
            full_name,
            phone,
            profile_photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading bookings:', error);
        throw error;
      }

      console.log('📊 Dispatcher bookings loaded:', data?.length || 0);
      setBookings(data || []);
    } catch (error) {
      console.error('❌ Error in loadBookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    }
  };

  const loadDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('full_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'offer_sent': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'offer_accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCurrentPrice = (booking: any): number | null => {
    if (booking.final_price && booking.final_price > 0) return booking.final_price;
    return null;
  };

  const getPriceDisplay = (booking: any): string => {
    const currentPrice = getCurrentPrice(booking);
    if (currentPrice !== null) return `$${currentPrice}`;
    return booking.estimated_price ? `~$${booking.estimated_price}` : "Price pending";
  };

  const handleManageBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowManagementModal(true);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "bookings" | "drivers" | "messages" | "settings" | "payments");
  };

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">#{booking.id.slice(-8).toUpperCase()}</span>
            <Badge className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)}`}>
              {booking.status}
            </Badge>
          </div>
          <Clock className="w-4 h-4 text-gray-400" />
        </div>

        {/* Passenger Info */}
        {booking.passengers && (
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={booking.passengers.profile_photo_url} />
              <AvatarFallback className="bg-gray-200 text-gray-600">
                {booking.passengers.full_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{booking.passengers.full_name || 'Passenger'}</p>
              <p className="text-sm text-gray-500">{booking.passengers.phone}</p>
            </div>
          </div>
        )}

        {/* Locations */}
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
              {format(new Date(booking.pickup_time), 'MMM dd, yyyy - HH:mm')}
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

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-gray-900">{getPriceDisplay(booking)}</span>
          {!booking.driver_id && (
            <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-800">
              Needs Driver
            </Badge>
          )}
        </div>

        {/* Driver Info */}
        {booking.drivers && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900 mb-2">Assigned Driver</p>
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={booking.drivers.profile_photo_url} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {booking.drivers.full_name?.charAt(0) || 'D'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{booking.drivers.full_name}</p>
                <p className="text-xs text-gray-500">{booking.drivers.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            onClick={() => handleManageBooking(booking)}
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "drivers":
        return <DriverManagement drivers={drivers} onDriverUpdate={loadDrivers} />;
      case "messages":
        return <DispatcherMessaging bookings={bookings} />;
      case "settings":
        return <DispatcherSettings />;
      default:
        return (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-500">Bookings will appear here when passengers make requests.</p>
              </div>
            ) : (
              bookings.map(renderBookingCard)
            )}
          </div>
        );
    }
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
            <h1 className="text-xl font-semibold text-gray-900">
              {activeTab === "bookings" && "All Bookings"}
              {activeTab === "drivers" && "Drivers"}
              {activeTab === "messages" && "Messages"}
              {activeTab === "settings" && "Settings"}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("bookings")}
              className="text-xs"
            >
              <Settings className="w-4 h-4 mr-1" />
              Dispatcher
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-6 pb-24">
        {renderTabContent()}
      </div>

      {/* Bottom Nav */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userType="dispatcher"
        pendingActionsCount={bookings.filter((b) => !b.driver_id).length}
        hasActiveRide={false}
      />

      {/* Management Modal */}
      {showManagementModal && selectedBooking && (
        <BookingManagementModal
          booking={selectedBooking}
          drivers={drivers}
          isOpen={showManagementModal}
          onClose={() => {
            setShowManagementModal(false);
            setSelectedBooking(null);
          }}
          onUpdate={loadBookings}
        />
      )}
    </div>
  );
};

export default DispatcherDashboard;
