
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Shield, HelpCircle, UserCog } from "lucide-react";
import { NewPassengerPreferencesScreen } from "./NewPassengerPreferencesScreen";
import { SettingsModal } from "@/components/SettingsModal";

interface SettingsTabProps {
  passengerInfo: any;
}

export const SettingsTab = ({ passengerInfo }: SettingsTabProps) => {
  const [activeModal, setActiveModal] = useState<"notifications" | "privacy" | null>(null);
  const [showPreferencesScreen, setShowPreferencesScreen] = useState(false);

  if (showPreferencesScreen) {
    return (
      <NewPassengerPreferencesScreen
        userId={passengerInfo?.id}
        onBack={() => setShowPreferencesScreen(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
      
      {/* Passenger Preferences - New Option */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0"
            onClick={() => setShowPreferencesScreen(true)}
          >
            <div className="flex items-center gap-3 w-full">
              <UserCog className="w-5 h-5 text-gray-600" />
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Passenger Preferences</h3>
                <p className="text-sm text-gray-500">Set your ride preferences</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0"
            onClick={() => setActiveModal("notifications")}
          >
            <div className="flex items-center gap-3 w-full">
              <Bell className="w-5 h-5 text-gray-600" />
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Manage notification preferences</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0"
            onClick={() => setActiveModal("privacy")}
          >
            <div className="flex items-center gap-3 w-full">
              <Shield className="w-5 h-5 text-gray-600" />
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Privacy & Security</h3>
                <p className="text-sm text-gray-500">Control your data and privacy</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0"
          >
            <div className="flex items-center gap-3 w-full">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Help & Support</h3>
                <p className="text-sm text-gray-500">Get help and contact support</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Settings Modals */}
      <SettingsModal
        isOpen={activeModal === "notifications"}
        onClose={() => setActiveModal(null)}
        type="notifications"
        userId={passengerInfo?.id}
        userType="passenger"
      />

      <SettingsModal
        isOpen={activeModal === "privacy"}
        onClose={() => setActiveModal(null)}
        type="privacy"
        userId={passengerInfo?.id}
        userType="passenger"
      />
    </div>
  );
};
