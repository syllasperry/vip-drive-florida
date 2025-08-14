
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, CreditCard, Settings, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PassengerBookingsList } from "@/components/passenger/PassengerBookingsList";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { getPassengerBookingsByAuth, subscribeToBookingsAndPassengers } from "@/lib/api/bookings";
import { supabase } from "@/integrations/supabase/client";

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPassengerInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: passenger, error } = await supabase
          .from('passengers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (!error && passenger) {
          setPassengerInfo(passenger);
        }
      }
    } catch (error) {
      console.error('Error fetching passenger info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengerInfo();

    // Set up real-time subscription
    const subscription = subscribeToBookingsAndPassengers(() => {
      console.log('Real-time update detected, refetching passenger info...');
      fetchPassengerInfo();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleNewBooking = () => {
    navigate('/passenger/booking');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back{passengerInfo?.first_name ? `, ${passengerInfo.first_name}` : ''}
              </h1>
              <p className="text-sm text-gray-500">Ready for your next ride?</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Quick Book Button */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Button 
              onClick={handleNewBooking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Book a New Ride
            </Button>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="bookings" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings" className="flex flex-col items-center gap-1 py-2">
              <div className="w-5 h-5">📅</div>
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col items-center gap-1 py-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col items-center gap-1 py-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col items-center gap-1 py-2">
              <Settings className="w-4 h-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Bookings</h2>
              <PassengerBookingsList />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <MessagesTab />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <PaymentsTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsTab passengerInfo={passengerInfo} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PassengerDashboard;
