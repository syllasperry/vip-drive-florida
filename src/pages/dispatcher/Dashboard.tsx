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
import { getDispatcherBookings } from "@/lib/api/bookings";
import { isDispatcher } from "@/lib/auth/roleCheck";

const DispatcherDashboard = () => {
  const [activeTab, setActiveTab] = useState("bookings");
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/passenger/login");
        return;
      }
      
      // SECURITY FIX: Use role-based authorization instead of hardcoded email
      const hasDispatcherRole = await isDispatcher();
      if (!hasDispatcherRole) {
        console.warn('Unauthorized dispatcher access attempt:', session.user.email);
        toast({
          title: "Access Denied",
          description: "You don't have dispatcher privileges.",
          variant: "destructive",
        });
        navigate("/passenger/dashboard");
        return;
      }
      
      setUser(session.user);
      setAuthorized(true);
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!authorized) return;
      
      try {
        setLoading(true);
        console.log('[DISPATCHER DASHBOARD] Fetching data...');
        
        // Fetch bookings
        const bookingsData = await getDispatcherBookings();
        console.log('[DISPATCHER DASHBOARD] Bookings data:', bookingsData);
        setBookings(bookingsData || []);

        // Fetch drivers
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .order('created_at', { ascending: false });

        if (driversError) {
          console.error('Error fetching drivers:', driversError);
        } else {
          setDrivers(driversData || []);
        }

        // Count pending actions
        const pendingCount = (bookingsData || []).filter(
          (booking: any) => 
            booking.status === 'pending' || 
            booking.payment_confirmation_status === 'waiting_for_offer'
        ).length;
        setPendingActionsCount(pendingCount);

      } catch (error) {
        console.error('Error fetching dispatcher data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authorized, toast]);

  useEffect(() => {
    // Subscribe to booking changes
    const channel = supabase
      .channel('dispatcher-bookings')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          // Refetch data when bookings change
          if (user) {
            fetchDispatcherData();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchDispatcherData = async () => {
    try {
      const bookingsData = await getDispatcherBookings();
      setBookings(bookingsData || []);
      
      const pendingCount = (bookingsData || []).filter(
        (booking: any) => 
          booking.status === 'pending' || 
          booking.payment_confirmation_status === 'waiting_for_offer'
      ).length;
      setPendingActionsCount(pendingCount);
    } catch (error) {
      console.error('Error refetching dispatcher data:', error);
    }
  };

  const handleUpdate = () => {
    fetchDispatcherData();
  };

  const handleDriverUpdate = async () => {
    try {
      const { data: driversData, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching drivers:', error);
      } else {
        setDrivers(driversData || []);
      }
    } catch (error) {
      console.error('Error updating drivers:', error);
    }
  };

  const renderTabContent = () => {
    console.log('[DISPATCHER DASHBOARD] Rendering tab content:', { 
      activeTab, 
      loading, 
      bookingsCount: bookings?.length || 0 
    });

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (activeTab) {
      case "bookings":
        return (
          <DispatcherBookingManager 
            bookings={bookings} 
            onUpdate={handleUpdate}
          />
        );
      case "drivers":
        return (
          <DriverManagement 
            drivers={drivers} 
            onDriverUpdate={handleDriverUpdate}
          />
        );
      case "payments":
        return <PaymentsSection />;
      case "messages":
        return (
          <DispatcherMessaging 
            bookings={bookings}
          />
        );
      case "settings":
        return <DispatcherSettings />;
      default:
        return (
          <DispatcherBookingManager 
            bookings={bookings} 
            onUpdate={handleUpdate}
          />
        );
    }
  };

  if (!user || !authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            {!user ? "Loading dispatcher dashboard..." : "Verifying permissions..."}
          </p>
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
