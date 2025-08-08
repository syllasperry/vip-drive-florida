
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Settings, MessageCircle, Calendar, History, Bell } from "lucide-react";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { EarningsSection } from "@/components/dashboard/EarningsSection";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import OrganizedBookingsList from "@/components/dashboard/OrganizedBookingsList";
import { MessagesTab } from "@/components/dashboard/MessagesTab";
import { EnhancedSettingsModal } from "@/components/EnhancedSettingsModal";
import { BookingRequestModal } from "@/components/booking/BookingRequestModal";
import { DriverHistorySection } from "@/components/dashboard/DriverHistorySection";
import { MessagingInterface } from "@/components/MessagingInterface";
import { useRealtimeBookings } from "@/hooks/useRealtimeBookings";

const DriverDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedBookingForMessage, setSelectedBookingForMessage] = useState<any>(null);
  const [completedBookings, setCompletedBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('rides');
  const { toast } = useToast();

  const { 
    bookings, 
    loading: bookingsLoading, 
    error: bookingsError 
  } = useRealtimeBookings(user?.id || '', 'driver');

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
          await loadCompletedBookings(session.user.id);
        } else {
          window.location.href = '/driver/login';
        }
      } catch (error) {
        console.error('Error getting session:', error);
        toast({
          title: "Error",
          description: "Failed to load session",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, [toast]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadCompletedBookings = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          passengers (
            full_name,
            phone,
            profile_photo_url
          ),
          passenger:passengers (
            full_name,
            phone,
            profile_photo_url
          )
        `)
        .eq('driver_id', driverId)
        .in('status', ['completed', 'cancelled', 'declined'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setCompletedBookings(data || []);
    } catch (error) {
      console.error('Error loading completed bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load ride history",
        variant: "destructive"
      });
    }
  };

  const handleMessage = (booking: any) => {
    setSelectedBookingForMessage(booking);
  };

  const handleCall = (booking: any) => {
    const passengerPhone = booking.passengers?.phone || booking.passenger?.phone;
    if (passengerPhone) {
      const cleanPhone = passengerPhone.replace(/[^\d]/g, '');
      window.location.href = `tel:+1${cleanPhone}`;
    } else {
      toast({
        title: "No Phone Number",
        description: "No phone number available for this passenger",
        variant: "destructive"
      });
    }
  };

  const handleViewSummary = (booking: any) => {
    console.log("View summary for booking:", booking);
    // Implement view summary functionality
  };

  const handlePhotoUpload = async (file: File) => {
    console.log("Photo upload:", file);
    // Implement photo upload functionality
  };

  const handleProfileUpdate = () => {
    console.log("Profile update");
    // Implement profile update functionality
  };

  const handleSelectChat = (chatId: string) => {
    console.log("Select chat:", chatId);
    // Implement chat selection functionality
  };

  if (loading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Profile Header */}
        <ProfileHeader
          userType="driver"
          userProfile={userProfile}
          onPhotoUpload={handlePhotoUpload}
          onProfileUpdate={handleProfileUpdate}
        />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="rides" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Rides
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Earnings
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rides" className="space-y-4">
            <OrganizedBookingsList
              bookings={bookings}
              userType="driver"
              onMessage={handleMessage}
              onViewSummary={handleViewSummary}
              onCancelSuccess={() => {
                if (user?.id) {
                  loadCompletedBookings(user.id);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsSection />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesTab
              userType="driver"
              userId={user?.id || ''}
              onSelectChat={handleSelectChat}
            />
          </TabsContent>

          <TabsContent value="history">
            <DriverHistorySection
              bookings={completedBookings}
              currentDriverId={user?.id || ''}
              currentDriverName={userProfile?.full_name || user?.email || 'Driver'}
              currentDriverAvatar={userProfile?.profile_photo_url}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        userType="driver" 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Settings Modal */}
      {showSettings && (
        <EnhancedSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          userType="driver"
        />
      )}

      {/* Messaging Interface */}
      {selectedBookingForMessage && (
        <MessagingInterface
          isOpen={!!selectedBookingForMessage}
          onClose={() => setSelectedBookingForMessage(null)}
          userType="driver"
          bookingId={selectedBookingForMessage.id}
          currentUserId={user?.id || ''}
          currentUserName={userProfile?.full_name || user?.email || 'Driver'}
          currentUserAvatar={userProfile?.profile_photo_url}
          otherUserName={selectedBookingForMessage.passengers?.full_name || selectedBookingForMessage.passenger?.full_name}
          otherUserAvatar={selectedBookingForMessage.passengers?.profile_photo_url || selectedBookingForMessage.passenger?.profile_photo_url}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
