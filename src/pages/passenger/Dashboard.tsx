
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Mock user data - in a real app, this would come from auth/profile
  const mockUserProfile = {
    full_name: 'Passenger User',
    profile_photo_url: null,
    phone: null,
    email: null
  };

  const mockCurrentUserId = 'passenger-user-id';
  const mockCurrentUserName = 'Passenger User';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="passenger" 
          userProfile={mockUserProfile}
          onPhotoUpload={async (file: File) => {
            // Handle photo upload - placeholder for now
            console.log('Photo upload:', file);
          }}
        />
        
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

                <PassengerBookingsList key={refreshTrigger} onUpdate={handleUpdate} />
              </div>
            </TabsContent>

            <TabsContent value="messages" className="mt-0">
              <MessagesTab 
                bookings={[]}
                currentUserId={mockCurrentUserId}
                currentUserName={mockCurrentUserName}
              />
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
              <PaymentsTab bookings={[]} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <SettingsTab passengerInfo={mockUserProfile} />
            </TabsContent>
          </div>
        </Tabs>

        <FloatingActionButton onClick={() => console.log('FAB clicked')} />
        <BottomNavigation 
          userType="passenger"
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
};

export default PassengerDashboard;
