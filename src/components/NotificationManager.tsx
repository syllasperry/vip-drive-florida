import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationManagerProps {
  userId: string;
  userType: 'passenger' | 'driver';
}

export const NotificationManager = ({ userId, userType }: NotificationManagerProps) => {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const { toast } = useToast();

  // Load notification preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .single();

      if (data) {
        setSoundEnabled(data.sound_enabled);
      }
    };

    loadPreferences();
  }, [userId, userType]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSoundEnabled(true);
        await savePreferences(true);
        toast({
          title: "Notifications Enabled",
          description: "You'll receive sound notifications for important updates.",
        });
      }
    }
    setPermissionRequested(true);
  };

  // Save preferences to database
  const savePreferences = async (enabled: boolean) => {
    await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        user_type: userType,
        sound_enabled: enabled,
      });
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (soundEnabled) {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmshBSqL1fLNeSsFJIbJ8N2PQAoVYrHu66hSEgtHnt/yv2ofBSiJ1fLNeSsFJIHH8N2QQAoYW7Lv6qxSDgtJnt7xvWreBCaH0vLPeTEEKH6/8dyQQwwPXLTr7axWEAhInN/wuWofByOL0vLQeSsFJI3J8N2QQAoVYrHu66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIbJ8N2PQAoVYrHu66hSEgtHnt/yv2ofBSiJ1fLNeSsFI4jH8N6PQQwWXrHr6q1TDwpHnN7yu2odBSaJ0vLPeTEEKI++8t2QRAsPXLDr66xTEAxHnd7yu2odBSaG0vLQeTEGKH++8tyQQwwOW67q66xWDQhKmtz0umseBSmH0vLPeTEGKI7A8N2PQgoVYbDu66hSEghGnt/yv2ofBSiI1vHNeSsFJYjH8N6QQAoVYrHu66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIHH8N2QQAoVYrLt66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIbH8N6QQAoVYrLt66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIbH8N6QQAoVYrLt66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIbH8N6QQAoVYrHu66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIfH8N6QQAoVYrHu66hSEgtGnt/yv2ofBSiJ1fLNeSsFJIbH8N6QQAoVYrHu66hSEgtGnt/yv2ofBSiJ1fLNeSsFI=';
      audio.play().catch(() => {
        // Silently handle audio play errors
      });
    }
  };

  // Show notification prompt if not requested yet
  useEffect(() => {
    if (!permissionRequested && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        toast({
          title: "Enable Notifications?",
          description: "Get instant alerts with sound for booking updates and messages.",
          action: (
            <button 
              onClick={requestNotificationPermission}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
            >
              Enable
            </button>
          ),
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [permissionRequested, toast]);

  // Expose playNotificationSound globally
  useEffect(() => {
    (window as any).playNotificationSound = playNotificationSound;
  }, [soundEnabled]);

  return null;
};