
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Users, DollarSign, MessageCircle, Phone, Car, LogOut, Calculator, Settings } from 'lucide-react';
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
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
    setupRealtimeSubscription();
    
    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing dispatcher dashboard...');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email === 'syllasperry@gmail.com') {
          await loadBookings();
        }
      } catch (error) {
        console.error('Error in auto-refresh:', error);
      }
    }, 10000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== 'syllasperry@gmail.com') {
        navigate('/passenger/login');
        return;
      }

      loadBookings();
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/passenger/login');
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('dispatcher-bookings-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Enhanced real-time update for dispatcher:', payload);
          loadBookings();
        }
      )
      .subscribe((status) => {
        console.log('📡 Dispatcher subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading bookings for dispatcher...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            full_name,
            phone,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          ),
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedBookings: Booking[] = (data || []).map(booking => {
        console.log('📋 Processing dispatcher booking:', {
          id: booking.id,
          status: booking.status,
          ride_status: booking.ride_status,
          final_price: booking.final_price,
          driver_id: booking.driver_id
        });

        return {
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
          passengers: booking.passengers ? {
            id: booking.passenger_id,
            full_name: booking.passengers.full_name,
            phone: booking.passengers.phone,
            profile_photo_url: booking.passengers.profile_photo_url,
            preferred_temperature: booking.passengers.preferred_temperature,
            music_preference: booking.passengers.music_preference,
            interaction_preference: booking.passengers.interaction_preference,
            trip_purpose: booking.passengers.trip_purpose,
            additional_notes: booking.passengers.additional_notes
          } : undefined,
          drivers: booking.drivers ? {
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

      console.log('📊 Dispatcher bookings loaded:', mappedBookings.length);
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
    console.log('🔍 Dispatcher status mapping:', { status, rideStatus, paymentStatus });
    
    if (status === 'completed' || rideStatus === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    
    if (paymentStatus === 'all_set' || rideStatus === 'all_set') return 'all_set';
    
    if (status === 'offer_sent' || rideStatus === 'offer_sent') {
      return 'payment_pending';
    }
    
    return 'booking_requested';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/passenger/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "bookings":
        return (
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            <DispatcherBookingManager onUpdate={loadBookings} />
            <DispatcherBookingList bookings={bookings} onUpdate={loadBookings} />
          </div>
        );
      case "drivers":
        return (
          <div className="max-w-4xl mx-auto px-6 py-6">
            <DriverManagement />
          </div>
        );
      case "payments":
        return (
          <div className="max-w-4xl mx-auto px-6 py-6">
            <PaymentCalculator />
          </div>
        );
      case "messages":
        return (
          <div className="max-w-4xl mx-auto px-6 py-6">
            <DispatcherMessaging />
          </div>
        );
      case "settings":
        return (
          <div className="max-w-4xl mx-auto px-6 py-6">
            <DispatcherSettings />
          </div>
        );
      default:
        return (
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            <DispatcherBookingManager onUpdate={loadBookings} />
            <DispatcherBookingList bookings={bookings} onUpdate={loadBookings} />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">VIP Dispatcher Dashboard</h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderTabContent()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "bookings"
                ? "text-red-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Car className={`h-6 w-6 mb-1 ${activeTab === "bookings" ? "scale-110" : ""}`} />
            <span className="text-xs">Bookings</span>
          </button>
          
          <button
            onClick={() => setActiveTab("drivers")}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "drivers"
                ? "text-red-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users className={`h-6 w-6 mb-1 ${activeTab === "drivers" ? "scale-110" : ""}`} />
            <span className="text-xs">Drivers</span>
          </button>
          
          <button
            onClick={() => setActiveTab("payments")}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "payments"
                ? "text-red-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Calculator className={`h-6 w-6 mb-1 ${activeTab === "payments" ? "scale-110" : ""}`} />
            <span className="text-xs">Payments</span>
          </button>
          
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "messages"
                ? "text-red-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageCircle className={`h-6 w-6 mb-1 ${activeTab === "messages" ? "scale-110" : ""}`} />
            <span className="text-xs">Messages</span>
          </button>
          
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center py-3 px-2 transition-colors ${
              activeTab === "settings"
                ? "text-red-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Settings className={`h-6 w-6 mb-1 ${activeTab === "settings" ? "scale-110" : ""}`} />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
