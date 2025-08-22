
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
    full_name: null as string | null,
    profile_photo_url: null as string | null,
    phone: null as string | null,
    email: null as string | null
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ User not authenticated, redirecting to login');
          navigate('/passenger/login');
          return;
        }
        console.log('✅ User authenticated:', user.id);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Auth check error:', error);
        navigate('/passenger/login');
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.id);
      if (!session?.user) {
        navigate('/passenger/login');
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load passenger info from profile and auth
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadPassengerInfo = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading passenger info...');
        
        // Get auth user first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          console.error('❌ No authenticated user or email');
          return;
        }

        console.log('👤 Auth user email:', user.email);

        // Set email as fallback immediately
        setPassengerInfo({
          full_name: user.email,
          profile_photo_url: null,
          phone: null,
          email: user.email
        });

        // Try to get passenger profile by user_id
        const { data: passengerProfile, error: passengerError } = await supabase
          .from('passengers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (passengerError) {
          console.warn('⚠️ No passenger profile found:', passengerError);
          
          // Try to create passenger profile
          const { data: newProfile, error: createError } = await supabase
            .from('passengers')
            .insert({
              user_id: user.id,
              full_name: user.email,
              email: user.email,
              phone: null,
              profile_photo_url: null
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating passenger profile:', createError);
            return;
          }

          console.log('✅ Passenger profile created:', newProfile);
          setPassengerInfo({
            full_name: newProfile.full_name || user.email,
            profile_photo_url: newProfile.profile_photo_url,
            phone: newProfile.phone,
            email: newProfile.email || user.email
          });
        } else {
          console.log('✅ Passenger profile loaded:', passengerProfile);
          setPassengerInfo({
            full_name: passengerProfile.full_name || user.email,
            profile_photo_url: passengerProfile.profile_photo_url,
            phone: passengerProfile.phone,
            email: passengerProfile.email || user.email
          });
        }

      } catch (error) {
        console.error('❌ Failed to load passenger info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPassengerInfo();
  }, [refreshTrigger, isAuthenticated]);

  // Set up realtime subscription with enhanced refresh
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

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
    // Check authentication before allowing navigation
    const checkAuthAndNavigate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a new booking.",
          variant: "destructive",
        });
        navigate('/passenger/login');
        return;
      }
      navigate('/passenger/price-estimate');
    };
    
    checkAuthAndNavigate();
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      console.log('📸 Photo upload:', file);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update passenger profile with new photo URL
      const { error: updateError } = await supabase
        .from('passengers')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log('✅ Photo uploaded successfully');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      throw error;
    }
  };

  const mockCurrentUserId = 'passenger-user-id';
  const mockCurrentUserName = passengerInfo.full_name || 'Passenger User';

  if (!isAuthenticated || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="passenger" 
          userProfile={passengerInfo}
          onPhotoUpload={handlePhotoUpload}
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
