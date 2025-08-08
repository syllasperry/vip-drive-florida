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
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const { toast } = useToast();

  // Use realtime bookings hook
  const { 
    bookings: realtimeBookings, 
    loading: realtimeLoading,
    error: realtimeError 
  } = useRealtimeBookings('driver');

  useEffect(() => {
    fetchDriverData();
  }, []);

  useEffect(() => {
    if (realtimeBookings) {
      setBookings(realtimeBookings);
      setLoading(realtimeLoading);
    }
  }, [realtimeBookings, realtimeLoading]);

  const fetchDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (driverError) {
        console.error('Error fetching driver:', driverError);
        return;
      }

      setDriver(driverData);
    } catch (error) {
      console.error('Error in fetchDriverData:', error);
      toast({
        title: "Error",
        description: "Failed to load driver data",
        variant: "destructive"
      });
    }
  };

  const handleStatusUpdate = () => {
    // Refresh bookings when status is updated
    fetchDriverData();
  };

  const handleReopenModal = (status: string) => {
    console.log('Reopening modal for status:', status);
  };

  const handleMessage = (booking?: any) => {
    console.log('Opening message for booking:', booking?.id);
  };

  const handleViewSummary = (booking?: any) => {
    console.log('Opening summary for booking:', booking?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary-glow/5">
      <NotificationManager userType="driver" />
      
      <div className="container mx-auto px-4 py-6 max-w-md">
        <ProfileHeader
          user={driver}
          userType="driver"
          title="Driver Dashboard"
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
              bookings={bookings}
              userType="driver"
              onMessage={handleMessage}
              onViewSummary={handleViewSummary}
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
                bookings={bookings}
                currentDriverId={driver?.id}
                currentDriverName={driver?.full_name}
                currentDriverAvatar={driver?.profile_photo_url}
              />
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagesTab 
              userType="driver" 
              bookings={bookings}
              currentUserId={driver?.id}
              currentUserName={driver?.full_name}
              currentUserAvatar={driver?.profile_photo_url}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <EarningsSection bookings={bookings} />
            <PaymentsTab bookings={bookings} userType="driver" />
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

        <FloatingActionButton userType="driver" />
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
