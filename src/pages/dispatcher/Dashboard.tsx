
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { EarningsSection } from '@/components/dashboard/EarningsSection';
import { DispatcherBookingList } from '@/components/dispatcher/DispatcherBookingList';
import { DriverManagement } from '@/components/dispatcher/DriverManagement';
import { PaymentsSection } from '@/components/dispatcher/PaymentsSection';
import { FinancialReports } from '@/components/dispatcher/FinancialReports';
import { DispatcherSettings } from '@/components/dispatcher/DispatcherSettings';
import { subscribeToBookingsAndPassengers } from '@/lib/api/bookings';

const DispatcherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Set up realtime subscription for dispatcher
  useEffect(() => {
    const unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time update in Dispatcher Dashboard - triggering refresh...');
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const dispatcherProfile = {
    full_name: 'Dispatcher Admin',
    profile_photo_url: null,
    phone: null,
    email: 'dispatcher@viprides.com'
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="dispatcher" 
          userProfile={dispatcherProfile}
          onPhotoUpload={async (file: File) => {
            console.log('Photo upload:', file);
          }}
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 sticky top-0 z-10 bg-white border-b text-xs">
            <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs">Drivers</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="bookings" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Booking Management
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Monitor and manage all ride bookings in real-time.
                  </p>
                </div>

                <DispatcherBookingList key={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="drivers" className="mt-0">
              <DriverManagement />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentsSection />
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <FinancialReports />
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
