
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
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
          driver_id: booking.driver_id,
          isManuallyAssigned: booking.driver_id ? 'YES' : 'NO'
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

      console.log('📊 Dispatcher bookings loaded:', {
        total: mappedBookings.length,
        withDrivers: mappedBookings.filter(b => b.driver_id).length,
        withoutDrivers: mappedBookings.filter(b => !b.driver_id).length
      });
      
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
    
    // Map 'pending' status to 'booking_requested' for consistency
    if (status === 'pending') return 'booking_requested';
    
    return status === 'assigned' ? 'payment_pending' : 'booking_requested';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/passenger/login');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "bookings":
        return (
          <div className="max-w-4xl mx-auto px-6 py-6">
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
          <div className="max-w-4xl mx-auto px-6 py-6">
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
            <svg className={`h-6 w-6 mb-1 ${activeTab === "bookings" ? "scale-110" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
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
            <svg className={`h-6 w-6 mb-1 ${activeTab === "drivers" ? "scale-110" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
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
            <svg className={`h-6 w-6 mb-1 ${activeTab === "payments" ? "scale-110" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
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
            <svg className={`h-6 w-6 mb-1 ${activeTab === "messages" ? "scale-110" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
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
            <svg className={`h-6 w-6 mb-1 ${activeTab === "settings" ? "scale-110" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
