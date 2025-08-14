
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, User, Bell, Shield, HelpCircle, LogOut, Heart } from 'lucide-react';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { PreferencesSettingsCard } from './PreferencesSettingsCard';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface SettingsTabProps {
  passenger?: {
    full_name?: string;
    profile_photo_url?: string;
    email?: string;
    phone?: string;
  };
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ passenger }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const settingsItems = [
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Update your personal information',
      action: () => setShowProfileModal(true),
    },
    {
      icon: Heart,
      title: 'Preferences',
      description: 'Ride preferences and comfort settings',
      action: () => setShowPreferences(true),
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Manage notification preferences',
      action: () => setShowNotificationModal(true),
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Privacy settings and security options',
      action: () => {},
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help and contact support',
      action: () => {},
    },
  ];

  if (showPreferences) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setShowPreferences(false)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <PreferencesSettingsCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={passenger?.profile_photo_url} />
              <AvatarFallback>
                {passenger?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {passenger?.full_name || 'User'}
              </h3>
              <p className="text-sm text-gray-600">
                {passenger?.email || 'No email provided'}
              </p>
              <p className="text-sm text-gray-600">
                {passenger?.phone || 'No phone provided'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Options */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Card>
        <CardContent className="p-4">
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};
