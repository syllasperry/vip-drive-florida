import { useState } from "react";
import { X, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "notifications" | "privacy";
}

export const SettingsModal = ({ isOpen, onClose, type }: SettingsModalProps) => {
  const [settings, setSettings] = useState({
    notifications: {
      bookingUpdates: true,
      driverMessages: true,
      promotions: false,
      emailNotifications: true,
      smsNotifications: true
    },
    privacy: {
      shareLocation: true,
      sharePhoneNumber: true,
      shareEmail: false,
      dataCollection: true,
      thirdPartySharing: false
    }
  });

  const handleToggle = (category: "notifications" | "privacy", setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting as keyof typeof prev[typeof category]]
      }
    }));
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
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications" className="text-card-foreground">
                  SMS Notifications
                </Label>
                <Switch
                  id="sms-notifications"
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={() => handleToggle("notifications", "smsNotifications")}
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
          <Button onClick={onClose} variant="luxury" className="w-full">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};