
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';
import { fetchMyPassengerProfile } from '@/lib/passenger/profile';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePassengerAuth } from '@/hooks/usePassengerAuth';
import { Loader2 } from 'lucide-react';

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [passengerInfo, setPassengerInfo] = useState({
    full_name: '',
    profile_photo_url: null,
    phone: null,
    email: null
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, hasProfile, isAuthenticated } = usePassengerAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/passenger/login');
      return;
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load passenger info
  useEffect(() => {
    const loadPassengerInfo = async () => {
      if (!isAuthenticated || !hasProfile) return;
      
      try {
        console.log('🔄 Loading passenger info...');
        
        const profile = await fetchMyPassengerProfile();
        if (profile) {
          setPassengerInfo({
            full_name: profile.full_name || 'Passenger User',
            profile_photo_url: profile.profile_photo_url,
            phone: profile.phone,
            email: profile.email
          });
          console.log('✅ Passenger profile loaded successfully');
        } else if (user?.email) {
          // Fallback to auth user email
          setPassengerInfo(prev => ({
            ...prev,
            email: user.email,
            full_name: user.email.split('@')[0]
          }));
        }
      } catch (error) {
        console.error('❌ Failed to load passenger info:', error);
        toast({
          title: "Warning",
          description: "Could not load passenger information. Please check your connection.",
          variant: "destructive",
        });
      }
    };

    loadPassengerInfo();
  }, [refreshTrigger, isAuthenticated, hasProfile, user, toast]);

  const handleUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleNewBooking = () => {
    navigate('/passenger/price-estimate');
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const mockCurrentUserId = user?.id || 'passenger-user-id';
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
          onProfileUpdate={() => setRefreshTrigger(prev => prev + 1)}
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
