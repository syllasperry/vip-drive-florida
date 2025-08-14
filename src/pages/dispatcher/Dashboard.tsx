import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DispatcherBookingManager } from "@/components/dispatcher/DispatcherBookingManager";
import { DriverManagement } from "@/components/dispatcher/DriverManagement";
import { PaymentsSection } from "@/components/dispatcher/PaymentsSection";
import { DispatcherMessaging } from "@/components/dispatcher/DispatcherMessaging";
import { DispatcherSettings } from "@/components/dispatcher/DispatcherSettings";
import { useNavigate } from "react-router-dom";

const DispatcherDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('No authenticated user found');
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      const userEmail = user.email?.toLowerCase();
      console.log('Checking dispatcher access for user:', userEmail);

      // Special case for syllasperry@gmail.com - always allow dispatcher access
      if (userEmail === 'syllasperry@gmail.com') {
        console.log('Granting dispatcher access to syllasperry@gmail.com');
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Check if user is in dispatchers table
      const { data: dispatcher, error: dispatcherError } = await supabase
        .from('dispatchers')
        .select('id, email')
        .eq('email', userEmail)
        .single();

      if (dispatcherError) {
        console.error('Error checking dispatcher status:', dispatcherError);
        
        // If no dispatcher found, deny access
        if (dispatcherError.code === 'PGRST116') {
          console.log('User not found in dispatchers table');
          setIsAuthenticated(false);
        } else {
          // Other errors, deny access for safety
          setIsAuthenticated(false);
        }
      } else if (dispatcher) {
        console.log('Dispatcher found:', dispatcher);
        setIsAuthenticated(true);
      } else {
        console.log('No dispatcher record found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Unexpected error in checkAuthentication:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading dispatcher dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the dispatcher dashboard.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="mt-6">
            <DispatcherBookingManager />
          </TabsContent>
          
          <TabsContent value="drivers" className="mt-6">
            <DriverManagement drivers={[]} onDriverUpdate={() => {}} />
          </TabsContent>
          
          <TabsContent value="payments" className="mt-6">
            <PaymentsSection />
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            <DispatcherMessaging bookings={[]} />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <DispatcherSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
