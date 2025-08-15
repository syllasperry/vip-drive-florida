
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PassengerBookingsList } from "@/components/passenger/PassengerBookingsList";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getPassengerBookings } from "@/lib/api/bookings";

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadUserProfile();
    loadBookings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/passenger/login');
    }
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get passenger profile
        const { data: passenger } = await supabase
          .from('passengers')
          .select('*')
          .eq('id', user.id)
          .single();

        setUserProfile({
          full_name: passenger?.full_name || user.user_metadata?.full_name || user.email,
          profile_photo_url: passenger?.profile_photo_url || user.user_metadata?.avatar_url,
          phone: passenger?.phone || user.user_metadata?.phone,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getPassengerBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update passenger profile - use correct upsert syntax
      await supabase
        .from('passengers')
        .upsert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email || 'User',
          email: user.email || '',
          profile_photo_url: data.publicUrl
        });

      await loadUserProfile();
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <ProfileHeader 
          userType="passenger" 
          userProfile={userProfile}
          onPhotoUpload={handlePhotoUpload}
        />
        
        <div className="px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="bookings" className="mt-0">
                <PassengerBookingsList onUpdate={loadBookings} />
              </TabsContent>

              <TabsContent value="messages" className="mt-0">
                <MessagesTab 
                  bookings={bookings}
                  currentUserId={userProfile?.id || ''}
                  currentUserName={userProfile?.full_name || 'User'}
                />
              </TabsContent>

              <TabsContent value="payments" className="mt-0">
                <PaymentsTab bookings={bookings} />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <SettingsTab passengerInfo={userProfile} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard;
