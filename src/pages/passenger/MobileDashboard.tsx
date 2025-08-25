
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MessageCircle, CreditCard, Settings, User, Bell } from 'lucide-react';
import PassengerBookingsList from '@/components/passenger/PassengerBookingsList';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useMyBookings } from '@/hooks/useMyBookings';

interface PassengerProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
}

const TabButton = ({ 
  id, 
  label, 
  icon: Icon, 
  isActive, 
  onClick, 
  badge 
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-3 transition-colors relative ${
      isActive 
        ? 'text-[#FF385C]' 
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    <div className="relative">
      <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-[#FF385C]' : 'text-gray-500'}`} />
      {badge && badge > 0 && (
        <div className="absolute -top-2 -right-2 bg-[#FF385C] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </div>
    <span className={`text-xs font-medium ${isActive ? 'text-[#FF385C]' : 'text-gray-500'}`}>
      {label}
    </span>
  </button>
);

export default function MobileDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { bookings } = useMyBookings();

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        navigate('/passenger/login');
        return;
      }

      let { data: passenger, error: passengerError } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!passenger && passengerError?.code === 'PGRST116') {
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

        if (!createError) {
          passenger = newPassenger;
        }
      }

      setUserProfile({
        ...user,
        passenger_profile: passenger
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentUserId = userProfile?.id || '';
  const currentUserName = userProfile?.passenger_profile?.full_name || 'User';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Your trips</h1>
                <p className="text-gray-500 text-sm">Manage your bookings</p>
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
          <div className="px-4">
            <MessagesTab 
              bookings={bookings}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        );
      case 'payments':
        return (
          <div className="px-4">
            <PaymentsTab bookings={bookings} />
          </div>
        );
      case 'profile':
        return (
          <div className="px-4">
            <SettingsTab 
              passengerInfo={userProfile?.passenger_profile}
              onUpdate={() => fetchUserProfile()}
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
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF385C] rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Passenger</span>
        </div>
        <Bell className="h-6 w-6 text-gray-500" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-20">
        {renderTabContent()}
      </div>

      {/* Bottom Navigation - Airbnb Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 h-16">
            <TabButton
              id="bookings"
              label="Bookings"
              icon={Calendar}
              isActive={activeTab === 'bookings'}
              onClick={() => setActiveTab('bookings')}
            />
            <TabButton
              id="messages"
              label="Messages"
              icon={MessageCircle}
              isActive={activeTab === 'messages'}
              onClick={() => setActiveTab('messages')}
              badge={getUnreadCount()}
            />
            <TabButton
              id="payments"
              label="Payments"
              icon={CreditCard}
              isActive={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
            />
            <TabButton
              id="profile"
              label="Profile"
              icon={Settings}
              isActive={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
