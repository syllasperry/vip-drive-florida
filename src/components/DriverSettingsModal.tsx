import { useState } from "react";
import { X, Bell, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DriverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settingType: "notifications" | "privacy" | null;
}

export const DriverSettingsModal = ({ isOpen, onClose, settingType }: DriverSettingsModalProps) => {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    newRides: true,
    paymentReceived: true,
    systemUpdates: false
  });

  const [privacy, setPrivacy] = useState({
    profilePhotoVisible: true,
    statusVisible: true,
    showLastSeen: false
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordChange = () => {
    // Handle password change logic here
    console.log("Password change requested");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  if (!isOpen || !settingType) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl w-full max-w-md max-h-[90vh] overflow-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            {settingType === "notifications" ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-xl font-semibold text-card-foreground">
              {settingType === "notifications" ? "Notifications" : "Privacy"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {settingType === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-card-foreground mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <Switch
                      id="email-notifications"
                      checked={notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                    <Switch
                      id="sms-notifications"
                      checked={notifications.sms}
                      onCheckedChange={(checked) => handleNotificationChange("sms", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifications">Push Notifications</Label>
                    <Switch
                      id="push-notifications"
                      checked={notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-card-foreground mb-4">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="new-rides">New Ride Requests</Label>
                    <Switch
                      id="new-rides"
                      checked={notifications.newRides}
                      onCheckedChange={(checked) => handleNotificationChange("newRides", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payment-received">Payment Confirmations</Label>
                    <Switch
                      id="payment-received"
                      checked={notifications.paymentReceived}
                      onCheckedChange={(checked) => handleNotificationChange("paymentReceived", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-updates">System Updates</Label>
                    <Switch
                      id="system-updates"
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => handleNotificationChange("systemUpdates", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingType === "privacy" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-card-foreground mb-4">Profile Visibility</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profile-photo">Show Profile Photo</Label>
                    <Switch
                      id="profile-photo"
                      checked={privacy.profilePhotoVisible}
                      onCheckedChange={(checked) => handlePrivacyChange("profilePhotoVisible", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="online-status">Show Online Status</Label>
                    <Switch
                      id="online-status"
                      checked={privacy.statusVisible}
                      onCheckedChange={(checked) => handlePrivacyChange("statusVisible", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="last-seen">Show Last Seen</Label>
                    <Switch
                      id="last-seen"
                      checked={privacy.showLastSeen}
                      onCheckedChange={(checked) => handlePrivacyChange("showLastSeen", checked)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-card-foreground mb-4">Account Security</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button 
                    onClick={handlePasswordChange}
                    className="w-full"
                    disabled={!passwordData.current || !passwordData.new || passwordData.new !== passwordData.confirm}
                  >
                    Update Password
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};