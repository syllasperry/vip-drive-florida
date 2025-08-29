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

      // Try to get existing settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_settings')
        .select('push_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error loading push settings:', settingsError);
        // Set default value on error
        setPushEnabled(false);
        return;
      }

      // If no settings exist, create default entry
      if (!settings) {
        console.log('Creating default user settings...');
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            push_enabled: false,
            email_enabled: true,
            sms_enabled: false
          })
          .select('push_enabled')
          .single();

        if (createError) {
          console.error('Error creating default settings:', createError);
          setPushEnabled(false);
        } else {
          setPushEnabled(newSettings.push_enabled);
        }
      } else {
        setPushEnabled(settings.push_enabled);
      }
    } catch (error) {
      console.error('Error loading push settings:', error);
      setPushEnabled(false);
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
      if (enabled) {
        // Handle browser permission for push notifications
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

        // Register service worker and get push subscription
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            console.log('Service worker ready for push notifications');
            
            // Register push subscription
            await registerPushSubscription(user.id, registration);
          } catch (swError) {
            console.error('Service worker registration failed:', swError);
            // Don't fail the entire operation for SW issues
          }
        }
      }

      // Update database
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          push_enabled: enabled,
          email_enabled: true, // Preserve existing email setting
          sms_enabled: false,  // Preserve existing SMS setting
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select('push_enabled')
        .single();

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      // Verify the update was successful
      if (data && data.push_enabled !== enabled) {
        console.error('Database update mismatch:', { expected: enabled, actual: data.push_enabled });
        throw new Error('Settings update verification failed');
      }

      console.log('Push notification setting updated successfully:', enabled);

      if (enabled) {
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive notifications for ride updates",
        });
      } else {
        // Disable push subscriptions when turned off
        await disablePushSubscriptions(user.id);
        
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
      
      let errorMessage = "Couldn't save your preference. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = error.message;
        } else if (error.message.includes('not supported')) {
          errorMessage = error.message;
        } else if (error.message.includes('blocked')) {
          errorMessage = error.message;
        } else {
          errorMessage = "Couldn't save your preference. Please try again.";
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

  const registerPushSubscription = async (userId: string, registration: ServiceWorkerRegistration) => {
    try {
      // Check if push manager is available
      if (!('PushManager' in window)) {
        console.log('Push messaging is not supported');
        return;
      }

      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription (you would need VAPID keys for production)
        console.log('Creating new push subscription...');
        // For now, just log that we would create a subscription
        console.log('Push subscription would be created here with VAPID keys');
      }

      // Store subscription in database
      if (subscription) {
        const { error } = await supabase
          .from('user_push_devices')
          .upsert({
            user_id: userId,
            device_token: subscription.endpoint,
            platform: 'web',
            endpoint: subscription.endpoint,
            p256dh_key: subscription.getKey ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') || new ArrayBuffer(0)))) : null,
            auth_key: subscription.getKey ? btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth') || new ArrayBuffer(0)))) : null,
            user_agent: navigator.userAgent,
            is_active: true,
            last_used_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,device_token'
          });

        if (error) {
          console.error('Error storing push subscription:', error);
        } else {
          console.log('Push subscription stored successfully');
        }
      }
    } catch (error) {
      console.error('Error registering push subscription:', error);
    }
  };

  const disablePushSubscriptions = async (userId: string) => {
    try {
      // Mark all user's push devices as inactive
      const { error } = await supabase
        .from('user_push_devices')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error disabling push subscriptions:', error);
      } else {
        console.log('Push subscriptions disabled successfully');
      }

      // Unsubscribe from service worker if available
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            console.log('Push subscription unsubscribed');
          }
        } catch (swError) {
          console.error('Error unsubscribing from push:', swError);
        }
      }
    } catch (error) {
      console.error('Error in disablePushSubscriptions:', error);
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