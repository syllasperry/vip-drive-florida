
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizedBookingsList } from "@/components/dashboard/OrganizedBookingsList";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchPassengerInfo();
    fetchBookings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/passenger/login');
    }
  };

  const fetchPassengerInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching passenger info:', error);
        return;
      }

      setPassengerInfo(data);
    } catch (error) {
      console.error('Error fetching passenger info:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }

      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBookings();
  };

  if (loading && !passengerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {passengerInfo?.full_name || 'Passenger'}!
              </h1>
              <p className="text-gray-600">Manage your rides and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <OrganizedBookingsList 
                bookings={bookings}
                onRefresh={handleRefresh}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <MessagesTab />
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <PaymentsTab />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <SettingsTab passengerInfo={passengerInfo} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
