
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDispatcherBookings } from "@/lib/api/bookings";

const Dashboard = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchBookings = async () => {
    try {
      console.log('🔄 Fetching dispatcher bookings...');
      const data = await getDispatcherBookings();
      setBookings(data);
      console.log('✅ Dispatcher bookings loaded:', data.length);
    } catch (error) {
      console.error('❌ Error fetching dispatcher bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true);
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('❌ No authenticated user, redirecting to login');
          navigate('/passenger/login', { replace: true });
          return;
        }

        console.log('✅ Authenticated user:', user.email);

        // Check if user is authorized dispatcher
        if (user.email !== 'syllasperry@gmail.com') {
          console.log('❌ Unauthorized email:', user.email, 'Expected: syllasperry@gmail.com');
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the dispatcher dashboard.",
            variant: "destructive",
          });
          navigate('/passenger/dashboard', { replace: true });
          return;
        }

        console.log('✅ Authorized dispatcher access for:', user.email);
        setIsAuthorized(true);
        
        // Load bookings data
        await fetchBookings();
        
      } catch (error) {
        console.error('❌ Error in auth/data loading:', error);
        navigate('/passenger/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <DispatcherBookingManager 
              bookings={bookings} 
              onUpdate={fetchBookings}
            />
          </TabsContent>

          <TabsContent value="drivers">
            <DriverManagement />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsSection />
          </TabsContent>

          <TabsContent value="messages">
            <DispatcherMessaging />
          </TabsContent>

          <TabsContent value="settings">
            <DispatcherSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
