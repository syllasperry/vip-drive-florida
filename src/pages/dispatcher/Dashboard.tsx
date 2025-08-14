
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { DispatcherBookingList } from '@/components/dispatcher/DispatcherBookingList';
import { DriverManagement } from '@/components/dispatcher/DriverManagement';
import { PaymentsSection } from '@/components/dispatcher/PaymentsSection';
import { DispatcherMessaging } from '@/components/dispatcher/DispatcherMessaging';
import { DispatcherSettings } from '@/components/dispatcher/DispatcherSettings';
import { getDispatcherBookings, subscribeToBookingsAndPassengers } from '@/data/bookings';

const DispatcherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);
  const [dispatcherInfo] = useState({
    full_name: 'Dispatcher Admin',
    profile_photo_url: null,
    phone: null,
    email: null
  });

  const loadBookings = async () => {
    try {
      const data = await getDispatcherBookings();
      setBookings(data);
    } catch (error) {
      console.error('Failed to load dispatcher bookings:', error);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [refreshTrigger]);

  // Set up realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time update in Dispatcher Dashboard - refreshing bookings...');
      loadBookings();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleUpdate = async () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const pendingActionsCount = bookings.filter(booking => 
    booking.payment_confirmation_status === 'waiting_for_offer'
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="dispatcher" as "passenger"
          userProfile={dispatcherInfo}
          onPhotoUpload={async (file: File) => {
            console.log('Photo upload:', file);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="px-4 pb-20">
            <TabsContent value="bookings" className="mt-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
              </div>
              <DispatcherBookingList 
                key={refreshTrigger} 
                onUpdate={handleUpdate} 
              />
            </TabsContent>

            <TabsContent value="drivers" className="mt-0">
              <DriverManagement />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentsSection />
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <DispatcherMessaging bookings={bookings} />
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
          pendingActionsCount={pendingActionsCount}
        />
      </div>
    </div>
  );
};

export default DispatcherDashboard;
