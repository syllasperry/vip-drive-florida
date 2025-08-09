
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, CreditCard, Car, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsCardProps {
  userId: string;
  onClose: () => void;
}

interface NotificationPreferences {
  push_enabled: boolean;
  booking_updates_enabled: boolean;
  driver_messages_enabled: boolean;
  email_enabled: boolean;
  sound_enabled: boolean;
  promotions_enabled: boolean;
}

export const NotificationSettingsCard = ({ userId, onClose }: NotificationSettingsCardProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: false,
    booking_updates_enabled: true,
    driver_messages_enabled: true,
    email_enabled: true,
    sound_enabled: false,
    promotions_enabled: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', 'passenger')
        .single();

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const savePreferences = async (prefs: NotificationPreferences) => {
    setIsSaving(true);
    try {
      await supabase.from('notification_preferences').upsert({
        user_id: userId,
        user_type: 'passenger',
        ...prefs,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">Get instant alerts on your device</p>
              </div>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => handleToggle('push_enabled', checked)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Car className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Ride Status Updates</Label>
                <p className="text-xs text-muted-foreground">Driver arrival, pickup, completion, etc.</p>
              </div>
            </div>
            <Switch
              checked={preferences.booking_updates_enabled}
              onCheckedChange={(checked) => handleToggle('booking_updates_enabled', checked)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Driver Messages</Label>
                <p className="text-xs text-muted-foreground">New chat messages and replies</p>
              </div>
            </div>
            <Switch
              checked={preferences.driver_messages_enabled}
              onCheckedChange={(checked) => handleToggle('driver_messages_enabled', checked)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Sound Alerts</Label>
                <p className="text-xs text-muted-foreground">Play sound with notifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.sound_enabled}
              onCheckedChange={(checked) => handleToggle('sound_enabled', checked)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start space-x-3">
              <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <Label className="text-sm font-medium">Promotional Offers</Label>
                <p className="text-xs text-muted-foreground">Special deals and discounts</p>
              </div>
            </div>
            <Switch
              checked={preferences.promotions_enabled}
              onCheckedChange={(checked) => handleToggle('promotions_enabled', checked)}
              disabled={isLoading || isSaving}
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
