import { useState, useEffect } from "react";
import { X, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "notifications" | "privacy";
  userId?: string;
  userType?: 'passenger' | 'driver';
}

export const SettingsModal = ({ isOpen, onClose, type, userId, userType }: SettingsModalProps) => {
  const [settings, setSettings] = useState({
    notifications: {
      bookingUpdates: true,
      driverMessages: true,
      promotions: false,
      emailNotifications: true,
    },
    privacy: {
      shareLocation: true,
      sharePhoneNumber: true,
      shareEmail: false,
      dataCollection: true,
      thirdPartySharing: false
    }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load notification preferences from database
  useEffect(() => {
    if (isOpen && type === 'notifications' && userId && userType) {
      loadNotificationPreferences();
    }
  }, [isOpen, type, userId, userType]);

  const loadNotificationPreferences = async () => {
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .single();

      if (data) {
        setSettings(prev => ({
          ...prev,
          notifications: {
            bookingUpdates: data.booking_updates_enabled ?? true,
            driverMessages: data.driver_messages_enabled ?? true,
            promotions: data.promotions_enabled ?? false,
            emailNotifications: data.email_enabled ?? true,
          }
        }));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const handleToggle = async (category: "notifications" | "privacy", setting: string) => {
    const newValue = !settings[category][setting as keyof typeof settings[typeof category]];
    
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: newValue
      }
    }));

    // Save notification preferences to database
    if (category === 'notifications' && userId && userType) {
      try {
        const updateData: any = {
          user_id: userId,
          user_type: userType,
        };

        switch (setting) {
          case 'bookingUpdates':
            updateData.booking_updates_enabled = newValue;
            break;
          case 'driverMessages':
            updateData.driver_messages_enabled = newValue;
            break;
          case 'promotions':
            updateData.promotions_enabled = newValue;
            break;
          case 'emailNotifications':
            updateData.email_enabled = newValue;
            break;
        }

        await supabase
          .from('notification_preferences')
          .upsert(updateData);
      } catch (error) {
        console.error('Error saving notification preferences:', error);
        toast({
          title: "Error",
          description: "Failed to save notification preferences",
          variant: "destructive",
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            {type === "notifications" ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-lg font-semibold text-card-foreground">
              {type === "notifications" ? "Notification Settings" : "Privacy Settings"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {type === "notifications" && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="booking-updates" className="text-card-foreground">
                  Booking Updates
                </Label>
                <Switch
                  id="booking-updates"
                  checked={settings.notifications.bookingUpdates}
                  onCheckedChange={() => handleToggle("notifications", "bookingUpdates")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="driver-messages" className="text-card-foreground">
                  Driver Messages
                </Label>
                <Switch
                  id="driver-messages"
                  checked={settings.notifications.driverMessages}
                  onCheckedChange={() => handleToggle("notifications", "driverMessages")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="promotions" className="text-card-foreground">
                  Promotions & Offers
                </Label>
                <Switch
                  id="promotions"
                  checked={settings.notifications.promotions}
                  onCheckedChange={() => handleToggle("notifications", "promotions")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="text-card-foreground">
                  Email Notifications
                </Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={() => handleToggle("notifications", "emailNotifications")}
                />
              </div>
            </>
          )}

          {type === "privacy" && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="share-location" className="text-card-foreground">
                  Share Location with Driver
                </Label>
                <Switch
                  id="share-location"
                  checked={settings.privacy.shareLocation}
                  onCheckedChange={() => handleToggle("privacy", "shareLocation")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="share-phone" className="text-card-foreground">
                  Share Phone Number
                </Label>
                <Switch
                  id="share-phone"
                  checked={settings.privacy.sharePhoneNumber}
                  onCheckedChange={() => handleToggle("privacy", "sharePhoneNumber")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="share-email" className="text-card-foreground">
                  Share Email Address
                </Label>
                <Switch
                  id="share-email"
                  checked={settings.privacy.shareEmail}
                  onCheckedChange={() => handleToggle("privacy", "shareEmail")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="data-collection" className="text-card-foreground">
                  Allow Data Collection
                </Label>
                <Switch
                  id="data-collection"
                  checked={settings.privacy.dataCollection}
                  onCheckedChange={() => handleToggle("privacy", "dataCollection")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="third-party" className="text-card-foreground">
                  Third-party Data Sharing
                </Label>
                <Switch
                  id="third-party"
                  checked={settings.privacy.thirdPartySharing}
                  onCheckedChange={() => handleToggle("privacy", "thirdPartySharing")}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button 
            onClick={onClose} 
            variant="luxury" 
            className="w-full"
            disabled={loading}
          >
            {loading ? "Saving..." : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};