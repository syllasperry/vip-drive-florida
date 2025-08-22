import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Bell, Shield, HelpCircle, LogOut, Settings as SettingsIcon, User } from "lucide-react";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { PrivacySecurityCard } from "./PrivacySecurityCard";
import { HelpSupportCard } from "./HelpSupportCard";
import { ProfileSettingsCard } from "./ProfileSettingsCard";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { getMyPassengerProfile } from "@/lib/api/profiles";

interface SettingsTabProps {
  passengerInfo: any;
}

interface PassengerProfile {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatarUrl: string | null;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<'notifications' | 'privacy' | 'help' | 'preferences' | 'profileSettings' | null>(null);
  const [currentPassengerInfo, setCurrentPassengerInfo] = useState(passengerInfo);
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Update local state when passengerInfo prop changes
  useEffect(() => {
    setCurrentPassengerInfo(passengerInfo);
  }, [passengerInfo]);

  // Load passenger profile when component mounts
  useEffect(() => {
    loadPassengerProfile();
  }, []);

  const loadPassengerProfile = async () => {
    setProfileLoading(true);
    try {
      const profile = await getMyPassengerProfile();
      setPassengerProfile(profile);
    } catch (error) {
      console.error('Error loading passenger profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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
    
    // Also reload the profile data
    await loadPassengerProfile();
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Iniciando logout...');
      
      // Limpar storage local primeiro
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Tentar logout global
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Erro no logout:', error);
        toast({
          title: "Erro no logout",
          description: "Houve um problema ao fazer logout. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Logout realizado com sucesso');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
      // Redirecionar para login forçando refresh da página
      window.location.href = '/passenger/login';
      
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const handleProfileSettingsUpdate = (updatedProfile: PassengerProfile) => {
    setPassengerProfile(updatedProfile);
    handleProfileUpdate();
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

  if (activeModal === 'preferences') {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setActiveModal(null)}
          className="mb-4"
        >
          ← Back to Settings
        </Button>
        <ProfileSettingsCard 
          passengerInfo={currentPassengerInfo}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      
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

        {/* Edit Profile Button - Added after Notifications */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setActiveModal('profileSettings')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Edit Profile</h3>
                <p className="text-sm text-gray-500">Update your personal information and photo</p>
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
          onClick={() => setActiveModal('preferences')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Preferences</h3>
                <p className="text-sm text-gray-500">Profile and account preferences</p>
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

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={activeModal === 'profileSettings'}
        onClose={() => setActiveModal(null)}
        profile={passengerProfile}
        onProfileUpdate={handleProfileSettingsUpdate}
      />
    </div>
  );
};
