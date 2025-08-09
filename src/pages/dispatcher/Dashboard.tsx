import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DispatcherBookingList } from "@/components/dispatcher/DispatcherBookingList";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentCalculator } from "@/components/dispatcher/PaymentCalculator";
import { FinancialReports } from "@/components/dispatcher/FinancialReports";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Booking } from "@/types/booking";

export default function DispatcherDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
    
    // Set up real-time subscription for bookings
    const channel = supabase
      .channel('dispatcher-dashboard')
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadBookings = async () => {
    try {
      console.log('🔄 Loading bookings for dispatcher dashboard...');
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers:passenger_id (
            id,
            full_name,
            phone,
            profile_photo_url,
            preferred_temperature,
            music_preference,
            interaction_preference,
            trip_purpose,
            additional_notes
          ),
          drivers:driver_id (
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

      const processedBookings: Booking[] = (data || []).map(booking => {
        // Only show driver info if both driver_id exists AND final_price exists (indicating manual assignment)
        const hasManualAssignment = booking.driver_id && booking.final_price;
        
        console.log('📋 Processing booking for dispatcher dashboard:', {
          id: booking.id,
          driver_id: booking.driver_id,
          final_price: booking.final_price,
          hasManualAssignment,
          status: booking.status,
          ride_status: booking.ride_status
        });

        return {
          id: booking.id,
          pickup_location: booking.pickup_location || '',
          dropoff_location: booking.dropoff_location || '',
          pickup_time: booking.pickup_time || '',
          passenger_count: booking.passenger_count || 1,
          vehicle_type: booking.vehicle_type,
          simple_status: mapToSimpleStatus(booking),
          estimated_price: booking.estimated_price,
          final_negotiated_price: booking.final_price,
          final_price: booking.final_price,
          created_at: booking.created_at,
          passenger_id: booking.passenger_id,
          driver_id: hasManualAssignment ? booking.driver_id : undefined, // Only show if manually assigned
          status: booking.status,
          ride_status: booking.ride_status,
          payment_confirmation_status: booking.payment_confirmation_status,
          passengers: booking.passengers,
          drivers: hasManualAssignment ? booking.drivers : undefined, // Only show if manually assigned
          driver_profiles: hasManualAssignment ? booking.drivers : undefined // Only show if manually assigned
        };
      });

      setBookings(processedBookings);
      console.log('📊 Bookings loaded for dispatcher dashboard:', processedBookings.length);
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const mapToSimpleStatus = (booking: any): Booking['simple_status'] => {
    if (booking.status === 'completed' || booking.ride_status === 'completed') return 'completed';
    if (booking.status === 'cancelled') return 'cancelled';
    if (booking.payment_confirmation_status === 'all_set' || booking.ride_status === 'all_set') return 'all_set';
    if (booking.ride_status === 'offer_sent' || booking.payment_confirmation_status === 'price_awaiting_acceptance') return 'payment_pending';
    return 'booking_requested';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "bookings":
        return <DispatcherBookingList bookings={bookings} onUpdate={loadBookings} />;
      case "messages":
        return <DispatcherMessaging />;
      case "drivers":
        return <DriverManagement />;
      case "calculator":
        return <PaymentCalculator />;
      case "reports":
        return <FinancialReports />;
      case "settings":
        return <DispatcherSettings />;
      default:
        return <DispatcherBookingList bookings={bookings} onUpdate={loadBookings} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 safe-bottom">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">VIP Dispatcher Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {renderActiveTab()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="dispatcher"
      />
    </div>
  );
}
