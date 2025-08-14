
import React, { useState, useEffect } from 'react';
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { PassengerBookingsList } from "@/components/passenger/PassengerBookingsList";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { supabase } from "@/integrations/supabase/client";

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [user, setUser] = useState<any>(null);
  const [passengerInfo, setPassengerInfo] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadUserData();
    loadBookings();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: passenger } = await supabase
          .from('passengers')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        setPassengerInfo(passenger);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <ProfileHeader 
          name={passengerInfo?.full_name || user?.email || 'User'}
          imageUrl={passengerInfo?.profile_photo_url}
        />
        
        <div className="px-4">
          {activeTab === 'bookings' && <PassengerBookingsList />}
          {activeTab === 'messages' && (
            <MessagesTab 
              bookings={bookings}
              currentUserId={user?.id || ''}
              currentUserName={passengerInfo?.full_name || user?.email || 'User'}
            />
          )}
          {activeTab === 'payments' && <PaymentsTab bookings={bookings} />}
          {activeTab === 'settings' && <SettingsTab passengerInfo={passengerInfo} />}
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
