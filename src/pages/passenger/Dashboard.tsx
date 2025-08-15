
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileHeader } from "@/components/dashboard/ProfileHeader";
import { BottomNavigation } from "@/components/dashboard/BottomNavigation";
import { PassengerBookingsList } from "@/components/passenger/PassengerBookingsList";
import { MessagesTab } from "@/components/passenger/MessagesTab";
import { PaymentsTab } from "@/components/passenger/PaymentsTab";
import { SettingsTab } from "@/components/passenger/SettingsTab";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const PassengerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
    loadUserBookings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/passenger/login');
        return;
      }

      const { data: profile } = await supabase
        .from('passengers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserBookings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('passenger_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Bookings loaded:', data?.length || 0);
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('passengers')
        .update({ profile_photo_url: publicUrl })
        .eq('auth_user_id', user.id);

      if (updateError) throw updateError;

      await loadUserProfile();
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to update profile photo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto">
        <div className="p-6">
          <ProfileHeader 
            userType="passenger" 
            userProfile={userProfile}
            onPhotoUpload={handlePhotoUpload}
            onProfileUpdate={loadUserProfile}
          />
          
          <div className="mt-6">
            {activeTab === 'bookings' && <PassengerBookingsList />}
            {activeTab === 'messages' && <MessagesTab />}
            {activeTab === 'payments' && <PaymentsTab />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>

      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userType="passenger"
      />
    </div>
  );
};

export default PassengerDashboard;
