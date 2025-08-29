import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotificationSettings = () => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('push_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading push settings:', error);
        return;
      }

      setPushEnabled(data?.push_enabled || false);
    } catch (error) {
      console.error('Error loading push settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePushSetting = async (enabled: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Optimistic update
    const previousValue = pushEnabled;
    setPushEnabled(enabled);
    setIsUpdating(true);

    try {
      // Handle browser permission for push notifications
      if (enabled) {
        if (!('Notification' in window)) {
          throw new Error('Push notifications are not supported in this browser');
        }

        if (Notification.permission === 'denied') {
          throw new Error('Push notifications are blocked. Please enable them in your browser settings.');
        }

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            throw new Error('Push notification permission was denied');
          }
        }

        // Register service worker if not already registered
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          console.log('Service worker ready for push notifications');
        }
      }

      // Update database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          push_enabled: enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      if (enabled) {
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive notifications for ride updates",
        });
      } else {
        toast({
          title: "Push Notifications Disabled",
          description: "You won't receive push notifications anymore",
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating push setting:', error);
      
      // Rollback optimistic update
      setPushEnabled(previousValue);
      
      const errorMessage = error instanceof Error ? error.message : "Couldn't save your preference. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const sendTestNotification = async () => {
    if (!pushEnabled) {
      toast({
        title: "Test Notification",
        description: "Enable push notifications first to test",
        variant: "destructive",
      });
      return;
    }

    try {
      // Send test notification via service worker
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        // For testing, we'll show a browser notification
        if (Notification.permission === 'granted') {
          new Notification('VIP Chauffeur Test', {
            body: 'This is a test notification from VIP Chauffeur Service',
            icon: '/lovable-uploads/3f28aecb-9019-4ca7-b1ca-54367debfe00.png',
            badge: '/lovable-uploads/3f28aecb-9019-4ca7-b1ca-54367debfe00.png'
          });
        }
      }

      toast({
        title: "Test Notification Sent",
        description: "Check your notifications to see if it worked",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Test Failed",
        description: "Could not send test notification",
        variant: "destructive",
      });
    }
  };

  return {
    pushEnabled,
    isLoading,
    isUpdating,
    updatePushSetting,
    sendTestNotification,
    refetch: loadSettings
  };
};