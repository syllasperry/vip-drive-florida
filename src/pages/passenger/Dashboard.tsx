
import React, { useState, useEffect } from 'react';
import { PassengerBookingsList } from "@/components/passenger/PassengerBookingsList";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { getPassengerBookingsByAuth } from "@/lib/api/bookings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
    loadBookings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: passenger } = await supabase
          .from('passengers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setUserProfile(passenger || {
          full_name: user.user_metadata?.full_name || 'Passenger',
          email: user.email,
          phone: '',
          profile_photo_url: null
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getPassengerBookingsByAuth();
      if (Array.isArray(data)) {
        setBookings(data);
        console.log('Loaded passenger bookings:', data.length);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return <PassengerBookingsList />;
      case 'messages':
        return (
          <MessagesTab 
            userType="passenger"
            userId={userProfile?.id || ''}
            onSelectChat={() => {}}
          />
        );
      case 'payments':
        return <PaymentsTab bookings={bookings} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <PassengerBookingsList />;
    }
  };

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading dashboard...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        <ProfileHeader 
          userType="passenger" 
          userProfile={userProfile || {}}
          onPhotoUpload={async (file: File) => {
            console.log('Photo upload for passenger:', file);
          }}
        />
        
        <div className="px-4 py-4">
          {renderTabContent()}
        </div>

        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userType="passenger"
        />
      </div>
    </div>
  );
};

export default PassengerDashboard;
