
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
import { DriverHistorySection } from '@/components/dashboard/DriverHistorySection';

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { toast } = useToast();

  console.log('🚗 DriverDashboard: Component rendering', { 
    driverId: driver?.id, 
    loading,
    activeTab 
  });

  // Use realtime bookings hook only when driver data is available
  const { 
    bookings, 
    loading: realtimeLoading,
    error: realtimeError 
  } = useRealtimeBookings({ 
    userId: driver?.id || '', 
    userType: 'driver',
    onBookingUpdate: (booking) => {
      console.log('🚗 Driver booking updated:', booking);
    }
  });

  useEffect(() => {
    console.log('🔄 DriverDashboard: Fetching driver data...');
    fetchDriverData();
  }, []);

  const fetchDriverData = async () => {
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

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (driverError) {
        console.error('❌ Error fetching driver:', driverError);
        // Create a basic driver object if not found
        setDriver({
          id: user.id,
          full_name: user.email?.split('@')[0] || 'Driver',
          email: user.email,
          profile_photo_url: null
        });
        setLoading(false);
        return;
      }

      console.log('✅ Driver data loaded:', driverData);
      setDriver(driverData);
    } catch (error) {
      console.error('💥 Error in fetchDriverData:', error);
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    console.log('🔄 Handling status update...');
    fetchDriverData();
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

  const handleCall = (booking?: any) => {
    if (booking?.passengers?.phone_number) {
      window.open(`tel:${booking.passengers.phone_number}`, '_self');
    }
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
        .from('drivers')
        .update({ profile_photo_url: data.publicUrl })
        .eq('id', user.id);

      fetchDriverData();
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
    console.log('➕ FAB clicked - could open driver actions');
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

  console.log('✅ DriverDashboard: Rendering main content', {
    driverLoaded: !!driver,
    bookingsCount: bookings?.length || 0,
    realtimeLoading
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      <NotificationManager 
        userId={driver?.id || ''}
        userType="driver" 
      />
      
      <div className="container mx-auto px-4 py-6 max-w-md">
        <ProfileHeader
          userProfile={driver}
          onPhotoUpload={handlePhotoUpload}
          userType="driver"
          isOnline={true}
          onProfileUpdate={fetchDriverData}
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
              bookings={bookings || []}
              userType="driver"
              onMessage={handleMessage}
              onViewSummary={handleViewSummary}
              onCall={handleCall}
              onStatusUpdate={handleStatusUpdate}
              onReopenModal={handleReopenModal}
              currentDriverId={driver?.id}
              currentDriverName={driver?.full_name}
              currentDriverAvatar={driver?.profile_photo_url}
            />
            
            {/* History Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Ride History</h3>
              <DriverHistorySection
                bookings={bookings || []}
                currentDriverId={driver?.id}
                currentDriverName={driver?.full_name}
                currentDriverAvatar={driver?.profile_photo_url}
              />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagesTab 
              userType="driver"
              userId={driver?.id || ''}
              onSelectChat={handleSelectChat}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <EarningsSection driverId={driver?.id} />
            <PaymentsTab userType="driver" userId={driver?.id} />
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
          userType="driver"
        />

        <FloatingActionButton onClick={handleFloatingActionClick} />
      </div>

      <RideStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        userType="driver"
        currentStatus=""
        nextStatus=""
        booking={selectedBooking}
      />
    </div>
  );
}
