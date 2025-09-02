
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, User, AlertCircle, RefreshCw } from 'lucide-react';
import PassengerBookingsList from '@/components/passenger/PassengerBookingsList';
import { ProfileSettingsModal } from '@/components/passenger/ProfileSettingsModal';
import { PassengerPreferencesCard } from '@/components/passenger/PassengerPreferencesCard';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useMyBookings } from '@/hooks/useMyBookings';
import { useToast } from '@/hooks/use-toast';

interface PassengerProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
}

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bookings');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { bookings } = useMyBookings(currentUserId || undefined);
  const MAX_RETRIES = 3;

  // Clean up URL parameters for better UX
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const canceled = urlParams.get('canceled');
      const bookingId = urlParams.get('booking_id');
      
      // Clean up URL parameters immediately
      if (canceled || bookingId) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
      
      if (canceled === 'true' && bookingId) {
        console.log('❌ Payment canceled detected from URL:', { bookingId });
        
        setTimeout(() => {
          toast({
            title: "Payment Canceled",
            description: "Your payment was canceled. You can try again anytime.",
            variant: "destructive",
          });
        }, 500);
      }
    } catch (error) {
      console.error('Error processing URL parameters:', error);
      // Continue loading dashboard even if URL processing fails
    }
  }, [toast]);

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
      
      setCurrentUserId(user.id);

      // Set passenger profile for modal
      if (passenger) {
        const nameParts = passenger.full_name?.split(' ') || [''];
        setPassengerProfile({
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          phone: passenger.phone || '',
          email: passenger.email || user.email || '',
          avatarUrl: passenger.profile_photo_url || null
        });
      }
      
      console.log('✅ Profile loaded successfully');
      setRetryCount(0);
      
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setProfileError(errorMessage);
      
      // Auto-retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Auto-retrying... Attempt ${retryCount + 1}/${MAX_RETRIES}`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchUserProfile(true), 2000 * (retryCount + 1));
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

  const handleProfileUpdate = (updatedProfile: PassengerProfile) => {
    setPassengerProfile(updatedProfile);
    fetchUserProfile(true);
  };

  const getUnreadCount = () => {
    return bookings.filter(booking => 
      booking.status === 'offer_sent' || 
      booking.payment_confirmation_status === 'waiting_for_payment'
    ).length;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF385C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-16 w-16 text-[#FF385C] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full gap-2 bg-[#FF385C] hover:bg-[#E31C5F]">
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

  const currentUserName = userProfile?.passenger_profile?.full_name || userProfile?.email?.split('@')[0] || 'User';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4 pt-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Your trips</h1>
                <p className="text-gray-500 text-sm">Welcome back, {currentUserName}</p>
              </div>
              <Button 
                onClick={() => navigate('/passenger/price-estimate')} 
                className="bg-[#FF385C] hover:bg-[#E31C5F] text-white rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Book
              </Button>
            </div>
            <div className="px-4">
              <PassengerBookingsList showHeader={false} />
            </div>
          </div>
        );
      case 'messages':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
            <MessagesTab 
              bookings={bookings}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        );
      case 'payments':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payments</h2>
            <PaymentsTab bookings={bookings} />
          </div>
        );
      case 'settings':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile & Settings</h2>
            <SettingsTab 
              passengerInfo={userProfile?.passenger_profile}
              onUpdate={() => fetchUserProfile(true)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Status Bar Spacer */}
      <div className="pt-safe-top" />
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF385C] rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Passenger</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto safe-bottom">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="passenger"
        pendingActionsCount={getUnreadCount()}
      />

      {/* Profile Settings Modal */}
      {showProfileModal && passengerProfile && (
        <ProfileSettingsModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={passengerProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
