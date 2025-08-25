
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, MessageCircle, CreditCard, Settings, User, Bell } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { EnhancedBookingCard } from '@/components/passenger/EnhancedBookingCard';
import { MessagesTab } from '@/components/passenger/MessagesTab';
import { PaymentsTab } from '@/components/passenger/PaymentsTab';
import { SettingsTab } from '@/components/passenger/SettingsTab';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSettingsModal } from '@/components/passenger/ProfileSettingsModal';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useMyBookings } from '@/hooks/useMyBookings';
import { getMyPassengerProfile } from '@/lib/api/profiles';

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
  const [notificationCount, setNotificationCount] = useState(3);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
  const { bookings, isLoading } = useMyBookings();

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

      // Load detailed profile with avatar
      try {
        const detailedProfile = await getMyPassengerProfile();
        setPassengerProfile(detailedProfile);
      } catch (profileError) {
        console.error('Error loading detailed profile:', profileError);
        // Fallback to basic profile
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
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [navigate]);

  const handleProfileUpdate = (updatedProfile: PassengerProfile) => {
    setPassengerProfile(updatedProfile);
    fetchUserProfile();
  };

  const getUnreadCount = () => {
    return bookings.filter(booking => 
      booking.status === 'offer_sent' || 
      booking.payment_confirmation_status === 'waiting_for_payment'
    ).length;
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
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
  
  const passenger = userProfile?.passenger_profile;
  
  // Use passengerProfile for display if available, fallback to passenger
  const displayProfile = passengerProfile || {
    first_name: passenger?.full_name?.split(' ')[0] || '',
    last_name: passenger?.full_name?.split(' ').slice(1).join(' ') || '',
    phone: passenger?.phone || '',
    email: passenger?.email || userProfile?.email || '',
    avatarUrl: passenger?.profile_photo_url || null
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Suas viagens</h1>
                <p className="text-gray-500 text-sm">Gerencie suas reservas</p>
              </div>
              <Button 
                onClick={() => navigate('/passenger/price-estimate')} 
                className="bg-[#FF385C] hover:bg-[#E31C5F] text-white rounded-full px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Reservar
              </Button>
            </div>
            
            <div className="px-4 space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma reserva ainda</h3>
                    <p className="text-gray-500 mb-4">
                      Comece criando sua primeira reserva
                    </p>
                    <Button 
                      onClick={() => navigate('/passenger/price-estimate')}
                      className="bg-[#FF385C] hover:bg-[#E31C5F] text-white"
                    >
                      Reserve Sua Primeira Viagem
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <EnhancedBookingCard
                    key={booking.id}
                    booking={booking}
                    passengerInfo={displayProfile}
                    onViewDetails={() => console.log('View details for:', booking.id)}
                  />
                ))
              )}
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
      
      {/* Header with Profile */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF385C] rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Passageiro</span>
          </div>
          <NotificationBell 
            count={notificationCount}
            onClick={handleNotificationClick}
          />
        </div>
        
        {/* Profile Header */}
        <div 
          className="cursor-pointer"
          onClick={() => setShowProfileModal(true)}
        >
          <ProfileHeader
            photoUrl={displayProfile.avatarUrl}
            firstName={displayProfile.first_name}
            lastName={displayProfile.last_name}
            email={displayProfile.email}
            showEmail={true}
            size="md"
          />
        </div>
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
              label="Settings"
              icon={Settings}
              isActive={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
            />
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      {showProfileModal && (
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
