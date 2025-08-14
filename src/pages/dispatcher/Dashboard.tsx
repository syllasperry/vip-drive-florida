
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { DispatcherBookingList } from '@/components/dispatcher/DispatcherBookingList';
import { DriverManagement } from '@/components/dispatcher/DriverManagement';
import { PaymentsSection } from '@/components/dispatcher/PaymentsSection';
import { DispatcherMessaging } from '@/components/dispatcher/DispatcherMessaging';
import { DispatcherSettings } from '@/components/dispatcher/DispatcherSettings';
import { subscribeToBookingsAndPassengers } from '@/lib/api/bookings';

const DispatcherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dispatcherInfo] = useState({
    full_name: 'Dispatcher User',
    profile_photo_url: null,
    phone: null,
    email: null
  });

  // Set up realtime subscription for dispatcher
  useEffect(() => {
    const unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time update in Dispatcher Dashboard - refreshing...');
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="dispatcher" 
          userProfile={dispatcherInfo}
          onPhotoUpload={async (file: File) => {
            console.log('Photo upload:', file);
          }}
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 sticky top-0 z-10 bg-white border-b">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="bookings" className="mt-0">
              <DispatcherBookingList 
                key={refreshTrigger} 
                bookings={[]}
                onUpdate={handleUpdate}
              />
            </TabsContent>

            <TabsContent value="drivers" className="mt-0">
              <DriverManagement 
                drivers={[]}
                onDriverUpdate={handleUpdate}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentsSection />
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <DispatcherMessaging />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <DispatcherSettings />
            </TabsContent>
          </div>
        </Tabs>

        <BottomNavigation 
          userType="dispatcher"
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
};

export default DispatcherDashboard;
