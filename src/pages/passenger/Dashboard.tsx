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
import { supabase } from '@/integrations/supabase/client';

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [passengerInfo, setPassengerInfo] = useState({
    full_name: 'Loading...',
    profile_photo_url: null,
    phone: null,
    email: null
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load passenger info from profile and auth
  useEffect(() => {
    const loadPassengerInfo = async () => {
      try {
        console.log('🔄 Loading passenger info...');
        
        // Get auth user first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          console.error('❌ No authenticated user or email');
          return;
        }

        // Set email as fallback immediately
        setPassengerInfo(prev => ({
          ...prev,
          email: user.email,
          full_name: user.email // Use email as name temporarily
        }));

        // Try to get passenger profile
        const profile = await fetchMyPassengerProfile();
        if (profile) {
          setPassengerInfo({
            full_name: profile.full_name || user.email,
            profile_photo_url: profile.profile_photo_url,
            phone: profile.phone,
            email: profile.email || user.email
          });
          console.log('✅ Passenger profile loaded successfully');
        } else {
          console.log('⚠️ No passenger profile found, using auth user email');
        }

      } catch (error) {
        console.error('❌ Failed to load passenger info:', error);
        // Don't show error toast for profile loading
        // Just keep the email as fallback
      }
    };

    loadPassengerInfo();
  }, [refreshTrigger]);

  // Set up realtime subscription with enhanced refresh
  useEffect(() => {
    console.log('📡 Setting up real-time subscription for passenger dashboard...');
    
    // Set up direct booking subscription for immediate updates
    const bookingChannel = supabase
      .channel('passenger_dashboard_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('📡 Direct booking update received:', payload);
          // Trigger immediate refresh
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log('📡 Direct booking subscription status:', status);
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(bookingChannel);
    };
  }, []);

  // Auto-refresh when navigating to bookings tab to catch new bookings
  useEffect(() => {
    if (activeTab === 'bookings') {
      console.log('🔄 Bookings tab activated - triggering refresh');
      setRefreshTrigger(prev => prev + 1);
    }
  }, [activeTab]);

  // Force refresh when component mounts or when returning from booking flow
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Window focused - refreshing dashboard');
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleUpdate = () => {
    console.log('🔄 Manual refresh triggered');
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
