
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, Settings, MessageSquare, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';
import { ProfileSettingsModal } from '@/components/passenger/ProfileSettingsModal';
import { PassengerPreferencesCard } from '@/components/passenger/PassengerPreferencesCard';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useMyBookings } from '@/hooks/useMyBookings';

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { bookings } = useMyBookings();
  const MAX_RETRIES = 3;

  const fetchUserProfile = async (forceRefresh = false) => {
    try {
      console.log('🔄 Fetching user profile...');
      setProfileError(null);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        console.log('❌ No user found, redirecting to login');
        navigate('/passenger/login');
        return;
      }

      console.log('✅ User authenticated:', user.email);

      // Try to get or create passenger profile
      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (passengerError) {
        console.error('❌ Error fetching passenger:', passengerError);
        
        // If passenger doesn't exist, create one
        if (passengerError.code === 'PGRST116') {
          console.log('🔨 Creating passenger profile...');
          const { data: newPassenger, error: createError } = await supabase
            .from('passengers')
            .insert([{
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              phone: user.user_metadata?.phone || ''
            }])
            .select()
            .single();

          if (createError) {
            console.error('❌ Error creating passenger:', createError);
            throw new Error('Failed to create passenger profile');
          }
          passenger = newPassenger;
        } else {
          throw passengerError;
        }
      }

      setUserProfile({
        ...user,
        passenger_profile: passenger
      });
      
      console.log('✅ Profile loaded successfully');
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setProfileError(errorMessage);
      
      // Auto-retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Auto-retrying... Attempt ${retryCount + 1}/${MAX_RETRIES}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchUserProfile(true), 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

  const handleRetry = () => {
    setAuthLoading(true);
    setRetryCount(0);
    fetchUserProfile(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            {retryCount >= MAX_RETRIES && (
              <Button 
                variant="outline" 
                onClick={() => navigate('/passenger/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = userProfile?.id || '';
  const currentUserName = userProfile?.passenger_profile?.full_name || userProfile?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userProfile?.passenger_profile?.full_name || userProfile?.email?.split('@')[0]}
              </h1>
              <p className="text-gray-600">Manage your rides and preferences</p>
            </div>
            <Button onClick={() => navigate('/passenger/price-estimate')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bookings">My Rides</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>My Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <PassengerBookingsList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab 
              bookings={bookings}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab bookings={bookings} />
          </TabsContent>

          <TabsContent value="preferences">
            <PassengerPreferencesCard />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab 
              passengerInfo={userProfile?.passenger_profile}
              onUpdate={() => fetchUserProfile(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Profile Settings Modal */}
        {showProfileModal && (
          <ProfileSettingsModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
          />
        )}
      </div>
    </div>
  );
}
