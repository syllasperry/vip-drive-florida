
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);

  const handleUpdate = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
  }, []);

  const handleNewBooking = useCallback(async () => {
    navigate('/passenger/price-estimate');
  }, [navigate]);

  const handlePhotoUpload = useCallback(async (file: File) => {
    try {
      console.log('📸 Photo upload started...');
      
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

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('passengers')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      console.log('✅ Photo uploaded successfully');
      handleUpdate();
      
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    }
  }, [handleUpdate, toast]);

  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;

    const initializeDashboard = async () => {
      if (initializingRef.current) {
        console.log('🚫 Already initializing, skipping...');
        return;
      }

      initializingRef.current = true;

      try {
        console.log('🔄 Initializing passenger dashboard...');
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('❌ User not authenticated, redirecting...');
          navigate('/passenger/login');
          return;
        }

        if (!mounted) return;

        console.log('✅ User authenticated:', user.id);
        
        // Set email immediately as fallback
        if (mounted) {
          setPassengerInfo(prev => ({
            ...prev,
            email: user.email
          }));
        }

        // Get or create passenger profile
        let { data: passengerProfile, error: passengerError } = await supabase
          .from('passengers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (passengerError && passengerError.code !== 'PGRST116') {
          console.error('❌ Error fetching passenger profile:', passengerError);
          throw passengerError;
        }

        if (!passengerProfile) {
          console.log('⚠️ No passenger profile found, creating one...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('passengers')
            .insert({
              user_id: user.id,
              full_name: user.email?.split('@')[0] || 'User',
              email: user.email,
              phone: null,
              profile_photo_url: null
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating passenger profile:', createError);
            throw createError;
          }

          passengerProfile = newProfile;
          console.log('✅ Passenger profile created');
        }

        if (mounted) {
          setPassengerInfo({
            full_name: passengerProfile.full_name || user.email?.split('@')[0] || 'User',
            profile_photo_url: passengerProfile.profile_photo_url,
            phone: passengerProfile.phone,
            email: passengerProfile.email || user.email
          });
          setLoading(false);
          setError(null);
          console.log('✅ Dashboard initialized successfully');
        }

      } catch (err) {
        console.error('❌ Dashboard initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard');
          setLoading(false);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    const loadingTimeout = setTimeout(() => {
      if (mounted && loading && !error) {
        console.warn('⚠️ Dashboard loading timeout after 10 seconds');
        setLoading(false);
        setError('Loading timeout. Please refresh the page.');
      }
    }, 10000);

    initializeDashboard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state change:', event);
      if (event === 'SIGNED_OUT' || !session?.user) {
        navigate('/passenger/login');
      }
    });

    return () => {
      mounted = false;
      mountedRef.current = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
      initializingRef.current = false;
      console.log('🧹 Dashboard cleanup completed');
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-700">Loading your dashboard...</p>
            <p className="text-sm text-gray-500">This should only take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Reload Page
            </Button>
            <Button 
              onClick={() => navigate('/passenger/login')} 
              variant="outline"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <ProfileHeader 
          userType="passenger" 
          userProfile={passengerInfo}
          onPhotoUpload={handlePhotoUpload}
          onProfileUpdate={handleUpdate}
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
                currentUserId="passenger-user-id"
                currentUserName={passengerInfo.full_name || 'Passenger User'}
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
