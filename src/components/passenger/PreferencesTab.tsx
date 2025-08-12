
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { PassengerPreferencesScreen } from "./PassengerPreferencesScreen";

interface PreferencesTabProps {
  passengerInfo: any;
}

export const PreferencesTab = ({ passengerInfo }: PreferencesTabProps) => {
  const [showPreferencesScreen, setShowPreferencesScreen] = useState(false);

  if (showPreferencesScreen) {
    return (
      <PassengerPreferencesScreen
        userId={passengerInfo?.id}
        onBack={() => setShowPreferencesScreen(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-0"
            onClick={() => setShowPreferencesScreen(true)}
          >
            <div className="flex items-center gap-3 w-full">
              <Settings className="w-5 h-5 text-gray-600" />
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900">Passenger Preferences</h3>
                <p className="text-sm text-gray-500">Set your ride preferences</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
