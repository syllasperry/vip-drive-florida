
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Phone, User, MessageCircle, Bell, BellOff, Settings, Star, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadges } from "@/components/status/StatusBadges";
import { RideStatusModal } from '@/components/RideStatusModal';
import { UniversalRideCard } from '@/components/dashboard/UniversalRideCard';
import { OrganizedBookingsList } from '@/components/dashboard/OrganizedBookingsList';
import { MessagesTab } from '@/components/dashboard/MessagesTab';
import { PaymentsTab } from '@/components/PaymentsTab';
import { EarningsSection } from '@/components/dashboard/EarningsSection';
import { BottomNavigation } from '@/components/dashboard/BottomNavigation';
import { FloatingActionButton } from '@/components/dashboard/FloatingActionButton';
import { ProfileHeader } from '@/components/dashboard/ProfileHeader';
import { NotificationManager } from '@/components/NotificationManager';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';

const PassengerDashboard = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { toast } = useToast();

  console.log('🎯 PassengerDashboard: Component rendering', { 
    passengerId: passenger?.id, 
    loading,
    activeTab 
  });

  // Use realtime bookings hook only when passenger data is available
  const { 
    bookings: realtimeBookings, 
    loading: realtimeLoading,
    error: realtimeError 
  } = useRealtimeBookings({ 
    userId: passenger?.id || '', 
    userType: 'passenger',
    onBookingUpdate: (booking) => {
      console.log('📱 Passenger booking updated:', booking);
    }
  });

  useEffect(() => {
    console.log('🔄 PassengerDashboard: Fetching passenger data...');
    fetchPassengerData();
  }, []);

  const fetchPassengerData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user from Supabase auth...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user found');
        setLoading(false);
        return;
      }

      console.log('👤 User found:', user.id);

      const { data: passengerData, error: passengerError } = await supabase
        .from('passengers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (passengerError) {
        console.error('❌ Error fetching passenger:', passengerError);
        // Create a basic passenger object if not found
        setPassenger({
          id: user.id,
          full_name: user.email?.split('@')[0] || 'Passenger',
          email: user.email,
          profile_photo_url: null
        });
        setLoading(false);
        return;
      }

      console.log('✅ Passenger data loaded:', passengerData);
      setPassenger(passengerData);
    } catch (error) {
      console.error('💥 Error in fetchPassengerData:', error);
      toast({
        title: "Error",
        description: "Failed to load passenger data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    console.log('🔄 Handling status update...');
    fetchPassengerData();
  };

  const handleReopenModal = (status: string) => {
    console.log('🔄 Reopening modal for status:', status);
  };

  const handleMessage = (booking?: any) => {
    console.log('💬 Opening message for booking:', booking?.id);
  };

  const handleViewSummary = (booking?: any) => {
    console.log('📄 Opening summary for booking:', booking?.id);
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      await supabase
        .from('passengers')
        .update({ profile_photo_url: data.publicUrl })
        .eq('id', user.id);

      fetchPassengerData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
    }
  };

  const handleSelectChat = (booking: any, otherUser: any) => {
    console.log('💬 Selected chat for booking:', booking?.id, 'with user:', otherUser);
  };

  const handleFloatingActionClick = () => {
    console.log('➕ FAB clicked - could open booking form');
  };

  // Show loading state
  if (loading) {
    console.log('⏳ Showing loading state...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if realtime error
  if (realtimeError) {
    console.error('📡 Realtime error:', realtimeError);
  }

  console.log('✅ PassengerDashboard: Rendering main content', {
    passengerLoaded: !!passenger,
    bookingsCount: realtimeBookings?.length || 0,
    realtimeLoading
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      <NotificationManager 
        userId={passenger?.id || ''}
        userType="passenger" 
      />
      
      <div className="container mx-auto px-4 py-6 max-w-md">
        <ProfileHeader
          userProfile={passenger}
          onPhotoUpload={handlePhotoUpload}
          userType="passenger"
          isOnline={true}
          onProfileUpdate={fetchPassengerData}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="bookings" className="text-xs">Bookings</TabsTrigger>
            <TabsTrigger value="messages" className="text-xs">Messages</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <OrganizedBookingsList
              bookings={realtimeBookings || []}
              userType="passenger"
              onMessage={handleMessage}
              onViewSummary={handleViewSummary}
              onStatusUpdate={handleStatusUpdate}
              onReopenModal={handleReopenModal}
              currentDriverId={passenger?.id}
              currentDriverName={passenger?.full_name}
              currentDriverAvatar={passenger?.profile_photo_url}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagesTab 
              userType="passenger"
              userId={passenger?.id || ''}
              onSelectChat={handleSelectChat}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentsTab userType="passenger" userId={passenger?.id} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Settings</h3>
                <p className="text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          userType="passenger"
        />

        <FloatingActionButton onClick={handleFloatingActionClick} />
      </div>

      <RideStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        userType="passenger"
        currentStatus=""
        nextStatus=""
        booking={selectedBooking}
      />
    </div>
  );
};

export default PassengerDashboard;
