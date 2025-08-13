
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, HelpCircle, LogOut } from "lucide-react";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { PrivacySecurityCard } from "./PrivacySecurityCard";
import { HelpSupportCard } from "./HelpSupportCard";
import { ProfileSettingsCard } from "./ProfileSettingsCard";

interface SettingsTabProps {
  passengerInfo: any;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'help' | null>(null);
  const [currentPassengerInfo, setCurrentPassengerInfo] = useState(passengerInfo);

  // Update local state when passengerInfo prop changes
  useEffect(() => {
    setCurrentPassengerInfo(passengerInfo);
  }, [passengerInfo]);

  const handleProfileUpdate = async () => {
    // Refresh passenger info after profile update
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: passenger, error } = await supabase
          .from('passengers')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && passenger) {
          setCurrentPassengerInfo(passenger);
        }
      }
    } catch (error) {
      console.error('Error refreshing passenger info:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/passenger/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (activeModal === 'notifications') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <NotificationSettingsCard 
          userId={currentPassengerInfo?.id} 
          onClose={() => setActiveModal(null)} 
        />
      </div>
    );
  }

  if (activeModal === 'privacy') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <PrivacySecurityCard onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  if (activeModal === 'help') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <HelpSupportCard onClose={() => setActiveModal(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      
      {/* Profile Settings Card - Restored */}
      <ProfileSettingsCard 
        passengerInfo={currentPassengerInfo}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Settings Options */}
      <div className="space-y-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('notifications')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Manage your notification preferences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('privacy')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Privacy & Security</h3>
                <p className="text-sm text-gray-500">Account security settings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('help')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Help & Support</h3>
                <p className="text-sm text-gray-500">Get help and contact support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout Button */}
      <Card>
        <CardContent className="p-4">
          <Button 
            onClick={handleLogout}
            variant="destructive" 
            className="w-full flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
