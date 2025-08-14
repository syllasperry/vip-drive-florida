
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Use realtime bookings hook for live updates
  const { bookings, loading, error, refetch } = useRealtimeBookings();

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    refetch();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader userType="passenger" />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-white border-b">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="home" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Welcome back!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Here are your recent ride bookings and updates.
                  </p>
                </div>

                <PassengerBookingsList onUpdate={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <MessagesTab />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentsTab />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <SettingsTab />
            </TabsContent>
          </div>
        </Tabs>

        <FloatingActionButton userType="passenger" />
        <BottomNavigation userType="passenger" />
      </div>
    </div>
  );
};

export default PassengerDashboard;
