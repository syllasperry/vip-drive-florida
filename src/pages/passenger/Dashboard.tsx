
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MessageSquare, CreditCard, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { OrganizedBookingsList } from "@/components/dashboard/OrganizedBookingsList";
import { mapToSimpleStatus } from "@/utils/bookingHelpers";

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPassengerInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading passenger info:', error);
        return;
      }

      setPassengerInfo(data);
    } catch (error) {
      console.error('Error in loadPassengerInfo:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers:passenger_id(*),
          drivers:driver_id(*)
        `)
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookings:', error);
        return;
      }

      const processedBookings = data?.map(booking => ({
        ...booking,
        simple_status: mapToSimpleStatus(booking)
      })) || [];

      setBookings(processedBookings);
    } catch (error) {
      console.error('Error in loadBookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengerInfo();
    loadBookings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back, {passengerInfo?.full_name?.split(' ')[0] || 'Passenger'}
              </h1>
              <p className="text-sm text-gray-500">Manage your rides and preferences</p>
            </div>
            <Button onClick={() => navigate('/passenger/booking')}>
              <Plus className="w-4 h-4 mr-2" />
              New Ride
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="mt-6">
            <OrganizedBookingsList 
              bookings={bookings} 
              onRefresh={() => {
                setLoading(true);
                loadBookings();
              }}
            />
          </TabsContent>

          <TabsContent value="messages" className="mt-6">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentsTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab passengerInfo={passengerInfo} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
