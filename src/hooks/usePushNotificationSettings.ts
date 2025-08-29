import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  loadPreferences, 
  savePreferences, 
  registerForPush, 
  unregisterFromPush,
  NotificationPreferences 
} from '@/lib/notifications/notificationsClient';

export const usePushNotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications_enabled: true,
    push_notifications_enabled: false,
    sms_notifications_enabled: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      console.log('📱 Loading notification settings...');
      
      const loadedPreferences = await loadPreferences();
      setPreferences(loadedPreferences);
      
      console.log('✅ Settings loaded successfully:', loadedPreferences);
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      
      // Use defaults on error
      setPreferences({
        email_notifications_enabled: true,
        push_notifications_enabled: false,
        sms_notifications_enabled: false
      });
      
      toast({
        title: "Error",
        description: "Couldn't load your notification preferences. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmailSetting = async (enabled: boolean) => {
    return await updateSetting('email_notifications_enabled', enabled);
  };

  const updateSmsSetting = async (enabled: boolean) => {
    return await updateSetting('sms_notifications_enabled', enabled);
  };

  const updatePushSetting = async (enabled: boolean) => {
    console.log('🔔 Updating push setting to:', enabled);
    
    // Optimistic update
    const previousPreferences = { ...preferences };
    setPreferences(prev => ({ ...prev, push_notifications_enabled: enabled }));
    setIsUpdating(true);

    try {
      if (enabled) {
        console.log('📱 Enabling push notifications...');
        
        // Register for push and get subscription keys
        const pushKeys = await registerForPush();
        console.log('✅ Push registration successful');
        
        // Save to database with push keys
        const updatedPreferences = await savePreferences({
          ...preferences,
          push_notifications_enabled: true
        }, pushKeys);
        
        setPreferences(updatedPreferences);
        
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive notifications for ride updates",
        });
        
        return true;
      } else {
        console.log('🔕 Disabling push notifications...');
        
        // Unregister from push (non-critical)
        await unregisterFromPush();
        
        // Save to database
        const updatedPreferences = await savePreferences({
          ...preferences,
          push_notifications_enabled: false
        });
        
        setPreferences(updatedPreferences);
        
        toast({
          title: "Push Notifications Disabled",
          description: "You won't receive push notifications anymore",
        });
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error updating push setting:', error);
      
      // Rollback optimistic update
      setPreferences(previousPreferences);
      
      let errorMessage = "Couldn't save your preference. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = error.message;
        } else if (error.message.includes('not supported') || error.message.includes('blocked')) {
          errorMessage = error.message;
        } else if (error.message.includes('Failed to save preferences')) {
          errorMessage = "Database error. Please try again.";
        }
      }
      
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

  const updateSetting = async (key: keyof NotificationPreferences, enabled: boolean) => {
    console.log(`📱 Updating ${key} to:`, enabled);
    
    // Optimistic update
    const previousPreferences = { ...preferences };
    setPreferences(prev => ({ ...prev, [key]: enabled }));
    setIsUpdating(true);

    try {
      const updatedPreferences = await savePreferences({
        ...preferences,
        [key]: enabled
      });
      
      setPreferences(updatedPreferences);
      
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Error updating ${key}:`, error);
      
      // Rollback optimistic update
      setPreferences(previousPreferences);
      
      toast({
        title: "Error",
        description: "Couldn't save your preference. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const sendTestNotification = async () => {
    if (!preferences.push_notifications_enabled) {
      toast({
        title: "Test Notification",
        description: "Enable push notifications first to test",
        variant: "destructive",
      });
      return;
    }

    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
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
    preferences,
    pushEnabled: preferences.push_notifications_enabled,
    emailEnabled: preferences.email_notifications_enabled,
    smsEnabled: preferences.sms_notifications_enabled,
    isLoading,
    isUpdating,
    updatePushSetting,
    updateEmailSetting,
    updateSmsSetting,
    sendTestNotification,
    refetch: loadSettings
  };
};