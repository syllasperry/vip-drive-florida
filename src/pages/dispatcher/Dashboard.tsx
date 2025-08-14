
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { useToast } from "@/hooks/use-toast";

const DispatcherDashboard = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/dispatcher/login");
        return;
      }
      setUser(session.user);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchPendingActions = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id')
          .in('status', ['pending', 'driver_assigned'])
          .eq('payment_confirmation_status', 'waiting_for_offer');

        if (error) throw error;
        setPendingActionsCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching pending actions:', error);
      }
    };

    fetchPendingActions();

    // Subscribe to booking changes
    const channel = supabase
      .channel('dispatcher-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => fetchPendingActions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "bookings":
        return <DispatcherBookingManager />;
      case "drivers":
        return <DriverManagement />;
      case "payments":
        return <PaymentsSection />;
      case "messages":
        return <DispatcherMessaging />;
      case "settings":
        return <DispatcherSettings />;
      default:
        return <DispatcherBookingManager />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dispatcher dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-md mx-auto">
        {renderTabContent()}
        
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userType="dispatcher"
          pendingActionsCount={pendingActionsCount}
        />
      </div>
    </div>
  );
};

export default DispatcherDashboard;
