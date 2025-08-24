import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { pushNotificationService } from "@/lib/pushNotifications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userType: 'passenger' | 'driver';
}

export const NotificationPermissionModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  userType 
}: NotificationPermissionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    
    try {
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        // Save preference to database
        await supabase.from('notification_preferences').upsert({
          user_id: userId,
          user_type: userType,
          push_enabled: true,
          booking_updates_enabled: true,
          driver_messages_enabled: true,
          email_enabled: true,
          sound_enabled: true
        });

        toast({
          title: "Notifications Enabled",
          description: "You'll receive push notifications for ride updates and messages.",
        });
        
        onClose();
      } else {
        toast({
          title: "Notifications Blocked",
          description: "You can enable notifications later in Settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    // Save preference to database
    await supabase.from('notification_preferences').upsert({
      user_id: userId,
      user_type: userType,
      push_enabled: false,
      booking_updates_enabled: true,
      driver_messages_enabled: true,
      email_enabled: true,
      sound_enabled: false
    });

    toast({
      title: "Notifications Disabled",
      description: "You can enable them later in Settings if you change your mind.",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Stay Updated with Push Notifications
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Get instant alerts about:
              </p>
              <ul className="text-sm space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Ride status updates
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  New messages from {userType === 'passenger' ? 'drivers' : 'passengers'}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Payment confirmations
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Important booking updates
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDecline}
              disabled={isLoading}
              className="w-full"
            >
              <BellOff className="h-4 w-4 mr-2" />
              Not Now
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            You can change this setting anytime in your app settings
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
