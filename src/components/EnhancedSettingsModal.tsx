import { useState } from "react";
import { X, Bell, Shield, Star, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsModal } from "./SettingsModal";
import { RidePreferencesModal } from "./RidePreferencesModal";

interface EnhancedSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userType?: 'passenger' | 'driver';
}

export const EnhancedSettingsModal = ({ isOpen, onClose, userId, userType }: EnhancedSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'notifications':
        setNotificationsModalOpen(true);
        break;
      case 'privacy':
        setPrivacyModalOpen(true);
        break;
      case 'preferences':
        setPreferencesModalOpen(true);
        break;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl w-full max-w-md shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-card-foreground">
              Settings
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notifications" className="text-xs">
                  <Bell className="h-4 w-4 mr-1" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="text-xs">
                  <Shield className="h-4 w-4 mr-1" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="preferences" className="text-xs">
                  <Star className="h-4 w-4 mr-1" />
                  Preferences
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-4">
                <TabsContent value="notifications" className="space-y-4">
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-2">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage how you receive notifications about bookings and messages
                    </p>
                    <Button 
                      onClick={() => handleTabClick('notifications')}
                      className="w-full"
                    >
                      Configure Notifications
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-4">
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-2">Privacy Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Control what information you share and how your data is used
                    </p>
                    <Button 
                      onClick={() => handleTabClick('privacy')}
                      className="w-full"
                    >
                      Manage Privacy
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-medium text-foreground mb-2">Ride Preferences</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set your preferred temperature, music, and conversation preferences
                    </p>
                    <Button 
                      onClick={() => handleTabClick('preferences')}
                      className="w-full"
                    >
                      Set Preferences
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border space-y-3">
            <Button 
              variant="destructive" 
              onClick={async () => {
                try {
                  // Clean up auth state
                  Object.keys(localStorage).forEach((key) => {
                    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
                      localStorage.removeItem(key);
                    }
                  });
                  
                  Object.keys(sessionStorage || {}).forEach((key) => {
                    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
                      sessionStorage.removeItem(key);
                    }
                  });

                  // Import supabase here to avoid circular imports
                  const { supabase } = await import("@/integrations/supabase/client");
                  await supabase.auth.signOut({ scope: 'global' });
                  window.location.href = "/passenger/login";
                } catch (error) {
                  console.error("Logout error:", error);
                  window.location.href = "/passenger/login";
                }
              }}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <SettingsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        type="notifications"
        userId={userId}
        userType={userType}
      />

      <SettingsModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        type="privacy"
        userId={userId}
        userType={userType}
      />

      <RidePreferencesModal
        isOpen={preferencesModalOpen}
        onClose={() => setPreferencesModalOpen(false)}
        userId={userId}
      />
    </>
  );
};