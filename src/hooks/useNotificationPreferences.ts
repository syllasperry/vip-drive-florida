import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export const useNotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: false,
    sms: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_notification_prefs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading notification preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          email: data.email,
          push: data.push,
          sms: data.sms
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Optimistic update
    const previousValue = preferences[key];
    setPreferences(prev => ({ ...prev, [key]: value }));
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('user_notification_prefs')
        .upsert({
          user_id: user.id,
          [key]: value,
          // Include other current values to ensure they're not overwritten
          email: key === 'email' ? value : preferences.email,
          push: key === 'push' ? value : preferences.push,
          sms: key === 'sms' ? value : preferences.sms,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      // Handle special cases
      if (key === 'push' && value) {
        await handlePushNotificationPermission();
      }

      if (key === 'sms' && value) {
        return 'phone_verification_required';
      }

      return 'success';
    } catch (error) {
      console.error('Error updating notification preference:', error);
      
      // Rollback optimistic update
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
      
      return 'error';
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePushNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        toast({
          title: "Not Supported",
          description: "Push notifications are not supported in this browser",
          variant: "destructive",
        });
        return;
      }

      if (Notification.permission === 'granted') {
        // Already have permission, register service worker if needed
        await registerPushNotifications();
        return;
      }

      if (Notification.permission === 'denied') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerPushNotifications();
        toast({
          title: "Push Notifications Enabled",
          description: "You'll now receive push notifications for ride updates",
        });
      } else {
        toast({
          title: "Permission Required",
          description: "Push notifications require browser permission",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error handling push notification permission:', error);
    }
  };

  const registerPushNotifications = async () => {
    try {
      // Register service worker and get push subscription
      // This is a simplified implementation
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // In a real implementation, you would:
      // 1. Get push subscription from service worker
      // 2. Send subscription to your backend
      // 3. Store device token in user_push_devices table
      
      console.log('Service worker registered for push notifications');
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  };

  return {
    preferences,
    isLoading,
    isUpdating,
    updatePreference,
    refetch: loadPreferences
  };
};