import React, { useState, useEffect } from 'react';
import { PassengerBookingsList } from "@/components/dashboard/OrganizedBookingsList";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { PaymentsTab } from "@/components/dashboard/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [passenger, setPassenger] = useState<{
    full_name?: string;
    profile_photo_url?: string;
  }>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
    loadPassengerData();
  }, []);

  const loadBookings = async () => {
    // Placeholder: Replace with actual data fetching logic
    // For example:
    // const bookingsData = await fetch('/api/bookings');
    // const bookings = await bookingsData.json();
    // setBookings(bookings);
    setBookings([
      {
        id: '1',
        pickup_location: '123 Main St',
        dropoff_location: '456 Elm St',
        pickup_time: '2024-07-15T10:00:00',
        passenger_count: 2,
        status: 'confirmed'
      },
      {
        id: '2',
        pickup_location: '789 Oak St',
        dropoff_location: '101 Pine St',
        pickup_time: '2024-07-16T14:00:00',
        passenger_count: 1,
        status: 'pending'
      }
    ]);
  };

  const loadPassengerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      const { data: passengerData, error } = await supabase
        .from('passengers')
        .select('full_name, profile_photo_url')
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching passenger data:', error);
        return;
      }

      setPassenger(passengerData || {});
    } catch (error) {
      console.error('Error loading passenger data:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            <ProfileHeader 
              full_name={passenger?.full_name}
              profile_photo_url={passenger?.profile_photo_url}
            />
            <PassengerBookingsList 
              bookings={bookings}
              onUpdate={loadBookings}
            />
          </div>
        );
      case 'messages':
        return <MessagesTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'settings':
        return <SettingsTab passenger={passenger} />;
      default:
        return (
          <div className="space-y-6">
            <ProfileHeader 
              full_name={passenger?.full_name}
              profile_photo_url={passenger?.profile_photo_url}
            />
            <PassengerBookingsList 
              bookings={bookings}
              onUpdate={loadBookings}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="px-6 py-4">
          {renderContent()}
        </div>
      </div>

      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="passenger"
        pendingActionsCount={0}
      />
    </div>
  );
};

export default PassengerDashboard;
