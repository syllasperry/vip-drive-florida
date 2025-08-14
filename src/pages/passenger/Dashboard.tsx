
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';
import { fetchPassengerBookings, subscribeToBookingsAndPassengers } from '@/lib/api/bookings';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [passengerInfo, setPassengerInfo] = useState({
    full_name: 'Passenger User',
    profile_photo_url: null,
    phone: null,
    email: null
  });
  const navigate = useNavigate();

  // Load passenger info from bookings
  useEffect(() => {
    const loadPassengerInfo = async () => {
      try {
        const bookings = await fetchPassengerBookings();
        if (bookings.length > 0 && bookings[0].passenger_name) {
          setPassengerInfo(prev => ({
            ...prev,
            full_name: bookings[0].passenger_name || 'Passenger User',
            profile_photo_url: bookings[0].passenger_photo_url,
            phone: bookings[0].passenger_phone,
            email: bookings[0].passenger_email
          }));
        }
      } catch (error) {
        console.error('Failed to load passenger info:', error);
      }
    };

    loadPassengerInfo();
  }, [refreshTrigger]);

  // Set up realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToBookingsAndPassengers(() => {
      console.log('🔄 Real-time update in Dashboard - refreshing passenger info...');
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleNewBooking = () => {
    navigate('/passenger/price-estimate');
  };

  const mockCurrentUserId = 'passenger-user-id';
  const mockCurrentUserName = passengerInfo.full_name || 'Passenger User';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="passenger" 
          userProfile={passengerInfo}
          onPhotoUpload={async (file: File) => {
            console.log('Photo upload:', file);
            setRefreshTrigger(prev => prev + 1);
          }}
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="px-4 pb-20">
            <TabsContent value="bookings" className="mt-0">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                <Button
                  onClick={handleNewBooking}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg"
                >
                  New Booking
                </Button>
              </div>

              <PassengerBookingsList key={refreshTrigger} onUpdate={handleUpdate} />
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
              <SettingsTab passengerInfo={passengerInfo} />
            </TabsContent>
          </div>
        </Tabs>

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
