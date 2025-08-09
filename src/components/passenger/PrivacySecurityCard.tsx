
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrivacySecurityCardProps {
  onClose: () => void;
}

export const PrivacySecurityCard = ({ onClose }: PrivacySecurityCardProps) => {
  const [settings, setSettings] = useState({
    shareLocation: true,
    sharePhoneNumber: true,
    shareEmail: false,
    dataCollection: true,
    thirdPartySharing: false
  });
  const { toast } = useToast();

  const handleToggle = (setting: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
    toast({
      title: "Setting Updated",
      description: "Your privacy preference has been saved.",
    });
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Privacy & Security
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Share Location with Driver</Label>
                <p className="text-xs text-muted-foreground">Allow drivers to see your pickup location</p>
              </div>
            </div>
            <Switch
              checked={settings.shareLocation}
              onCheckedChange={(checked) => handleToggle('shareLocation', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Share Phone Number</Label>
                <p className="text-xs text-muted-foreground">Allow drivers to contact you directly</p>
              </div>
            </div>
            <Switch
              checked={settings.sharePhoneNumber}
              onCheckedChange={(checked) => handleToggle('sharePhoneNumber', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Share Email Address</Label>
                <p className="text-xs text-muted-foreground">Allow drivers to see your email</p>
              </div>
            </div>
            <Switch
              checked={settings.shareEmail}
              onCheckedChange={(checked) => handleToggle('shareEmail', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Allow Data Collection</Label>
                <p className="text-xs text-muted-foreground">Help improve our service with usage analytics</p>
              </div>
            </div>
            <Switch
              checked={settings.dataCollection}
              onCheckedChange={(checked) => handleToggle('dataCollection', checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Third-party Data Sharing</Label>
                <p className="text-xs text-muted-foreground">Share data with partner services</p>
              </div>
            </div>
            <Switch
              checked={settings.thirdPartySharing}
              onCheckedChange={(checked) => handleToggle('thirdPartySharing', checked)}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </CardContent>
    </Card>
  );
};
