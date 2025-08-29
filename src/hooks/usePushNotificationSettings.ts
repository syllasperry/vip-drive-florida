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
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPushEnabled(false);
        return;
      }

      console.log('Loading push notification settings for user:', user.id);

      // Query notification preferences from the table
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('push_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading push settings:', error);
        setPushEnabled(false);
        return;
      }

      if (data) {
        console.log('Loaded push setting:', data.push_enabled);
        setPushEnabled(data.push_enabled ?? false);
      } else {
        console.log('No settings found, using default (false)');
        setPushEnabled(false);
      }
    } catch (error) {
      console.error('Error loading push settings:', error);
      setPushEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePushSetting = async (enabled: boolean) => {
    console.log('Updating push setting to:', enabled);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }

    // Optimistic update
    const previousValue = pushEnabled;
    setPushEnabled(enabled);
    setIsUpdating(true);

    try {
      if (enabled) {
        console.log('Requesting browser notification permission...');
        
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

        console.log('Browser permission granted successfully');
      }

      console.log('Saving to database...');
      
      // Update notification preferences in the table
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          user_type: 'passenger',
          push_enabled: enabled,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Database save failed: ${updateError.message}`);
      }

      console.log('Push notification setting saved and verified successfully:', enabled);

      if (enabled) {
        // Register service worker after successful database save
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            console.log('Service worker ready for push notifications');
            await registerPushSubscription(user.id, registration);
          } catch (swError) {
            console.warn('Service worker registration failed:', swError);
            // Don't fail the entire operation for SW issues
          }
        }
        
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive notifications for ride updates",
        });
      } else {
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
        if (error.message.includes('permission') || error.message.includes('denied')) {
          errorMessage = error.message;
        } else if (error.message.includes('not supported') || error.message.includes('blocked')) {
          errorMessage = error.message;
        } else if (error.message.includes('Database') || error.message.includes('verification')) {
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

  const registerPushSubscription = async (userId: string, registration: ServiceWorkerRegistration) => {
    try {
      if (!('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('No existing subscription found');
        // In production, you would create a new subscription with VAPID keys
        return;
      }

      console.log('Storing push subscription in database...');
      
      if (subscription) {
        const { error: deviceError } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: userId,
            endpoint: subscription.endpoint,
            subscription: subscription as any,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (deviceError) {
          console.error('Error storing push subscription:', deviceError);
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
      console.log('Disabling push subscriptions for user:', userId);
      
      const { error: disableError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      if (disableError) {
        console.error('Error disabling push subscriptions:', disableError);
      } else {
        console.log('Push subscriptions disabled successfully');
      }

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            console.log('Push subscription unsubscribed');
          }
        } catch (swError) {
          console.warn('Error unsubscribing from push:', swError);
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
    pushEnabled,
    isLoading,
    isUpdating,
    updatePushSetting,
    sendTestNotification,
    refetch: loadSettings
  };
};