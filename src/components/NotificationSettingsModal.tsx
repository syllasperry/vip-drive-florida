import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageCircle, CreditCard, Car, Gift } from "lucide-react";
import { pushNotificationService } from "@/lib/pushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: 'passenger' | 'driver';
}

interface NotificationPreferences {
  push_enabled: boolean;
  booking_updates_enabled: boolean;
  driver_messages_enabled: boolean;
  email_enabled: boolean;
  sound_enabled: boolean;
  promotions_enabled: boolean;
}

export const NotificationSettingsModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  userType 
}: NotificationSettingsModalProps) => {
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
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen, userId, userType]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
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
    // Special handling for push notifications
    if (key === 'push_enabled') {
      if (value) {
        // Request permission and subscribe
        try {
          const permission = await pushNotificationService.requestPermission();
          if (permission !== 'granted') {
            toast({
              title: "Permission Required",
              description: "Please allow notifications in your browser settings.",
              variant: "destructive"
            });
            return;
          }
        } catch (error) {
          console.error('Error requesting permission:', error);
          toast({
            title: "Error",
            description: "Failed to enable push notifications.",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Unsubscribe from push notifications
        await pushNotificationService.unsubscribe();
      }
    }

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  };

  const savePreferences = async (prefs: NotificationPreferences) => {
    setIsSaving(true);
    try {
      await supabase.from('notification_preferences').upsert({
        user_id: userId,
        user_type: userType,
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

  const notificationSections = [
    {
      title: "Push Notifications",
      description: "Receive native notifications on your device",
      items: [
        {
          key: 'push_enabled' as keyof NotificationPreferences,
          label: "Enable Push Notifications",
          description: "Get instant alerts on your device",
          icon: Bell
        }
      ]
    },
    {
      title: "Ride Updates",
      description: "Stay informed about your rides",
      items: [
        {
          key: 'booking_updates_enabled' as keyof NotificationPreferences,
          label: "Ride Status Updates",
          description: "Driver arrival, pickup, completion, etc.",
          icon: Car
        }
      ]
    },
    {
      title: "Communication",
      description: "Message and chat notifications",
      items: [
        {
          key: 'driver_messages_enabled' as keyof NotificationPreferences,
          label: `${userType === 'passenger' ? 'Driver' : 'Passenger'} Messages`,
          description: "New chat messages and replies",
          icon: MessageCircle
        },
        {
          key: 'sound_enabled' as keyof NotificationPreferences,
          label: "Sound Alerts",
          description: "Play sound with notifications",
          icon: Bell
        }
      ]
    },
    {
      title: "System Notifications",
      description: "Important account and payment updates",
      items: [
        {
          key: 'email_enabled' as keyof NotificationPreferences,
          label: "Email Notifications",
          description: "Receive updates via email",
          icon: CreditCard
        }
      ]
    },
    {
      title: "Optional",
      description: "Additional notifications",
      items: [
        {
          key: 'promotions_enabled' as keyof NotificationPreferences,
          label: "Promotional Offers",
          description: "Special deals and discounts (off by default)",
          icon: Gift
        }
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {notificationSections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              
              <div className="space-y-4">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between space-x-4">
                      <div className="flex items-start space-x-3">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-1">
                          <Label htmlFor={item.key} className="text-sm font-medium">
                            {item.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={item.key}
                        checked={preferences[item.key]}
                        onCheckedChange={(checked) => handleToggle(item.key, checked)}
                        disabled={isLoading || isSaving}
                      />
                    </div>
                  );
                })}
              </div>
              
              {sectionIndex < notificationSections.length - 1 && <Separator />}
            </div>
          ))}
          
          <div className="flex justify-end">
            <Button onClick={onClose} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
