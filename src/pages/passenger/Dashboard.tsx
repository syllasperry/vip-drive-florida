
import React, { useState, useEffect } from 'react';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { PassengerBookingsList } from '@/components/passenger/PassengerBookingsList';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { Badge } from '@/components/ui/badge';
import { fetchMyPassengerProfile, type PassengerMe } from '@/lib/passenger/me';
import { usePassengerBookings } from '@/hooks/usePassengerBookings';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [passengerProfile, setPassengerProfile] = useState<PassengerMe | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { bookings, loading: bookingsLoading, refetch } = usePassengerBookings();

  // Load passenger profile
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await fetchMyPassengerProfile();
      setPassengerProfile(profile);
    };

    loadProfile();
  }, []);

  const handlePhotoUpload = async (file: File) => {
    try {
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
      await supabase
        .from('passengers')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', user.id);

      // Refresh profile
      const updatedProfile = await fetchMyPassengerProfile();
      setPassengerProfile(updatedProfile);

    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  };

  const handleProfileUpdate = async () => {
    const updatedProfile = await fetchMyPassengerProfile();
    setPassengerProfile(updatedProfile);
    refetch(); // Refresh bookings in case profile changes affect them
  };

  const getTabCounts = () => {
    const activeBookings = bookings.filter(b => 
      ['pending', 'confirmed', 'in_progress', 'driver_assigned'].includes(b.status)
    ).length;
    
    const completedBookings = bookings.filter(b => 
      b.status === 'completed'
    ).length;

    return {
      all: bookings.length,
      active: activeBookings,
      completed: completedBookings
    };
  };

  const counts = getTabCounts();

  const renderContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="p-4 pb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">My Bookings</h2>
              <FloatingActionButton />
            </div>
            
            {/* Booking Filter Tabs */}
            <div className="flex space-x-1 bg-muted rounded-lg p-1 mb-6">
              <button className="flex-1 py-2 px-3 rounded-md bg-background text-foreground font-medium text-sm">
                All ({counts.all})
              </button>
              <button className="flex-1 py-2 px-3 rounded-md text-muted-foreground font-medium text-sm">
                Active ({counts.active})
              </button>
              <button className="flex-1 py-2 px-3 rounded-md text-muted-foreground font-medium text-sm">
                Completed ({counts.completed})
              </button>
            </div>

            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 text-muted-foreground">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">Book your first ride to get started!</p>
              </div>
            ) : (
              <PassengerBookingsList bookings={bookings} onRefresh={refetch} />
            )}
          </div>
        );
      case 'messages':
        return <MessagesTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        userProfile={passengerProfile ? {
          full_name: passengerProfile.full_name,
          profile_photo_url: passengerProfile.profile_photo_url
        } : userProfile}
        onPhotoUpload={handlePhotoUpload}
        userType="passenger"
        onProfileUpdate={handleProfileUpdate}
      />
      
      {renderContent()}
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} userType="passenger" />
    </div>
  );
};

export default Dashboard;
