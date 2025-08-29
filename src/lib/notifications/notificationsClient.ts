import { supabase } from '@/integrations/supabase/client';

export interface NotificationPreferences {
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  push_endpoint?: string;
  push_p256dh?: string;
  push_auth?: string;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Load notification preferences from database
 */
export async function loadPreferences(): Promise<NotificationPreferences> {
  try {
    console.log('📱 Loading notification preferences...');
    
    const { data, error } = await supabase.rpc('get_notification_preferences');
    
    if (error) {
      console.error('❌ Error loading preferences:', error);
      throw new Error(`Failed to load preferences: ${error.message}`);
    }

    // Handle empty result (no preferences row exists)
    if (!data || data.length === 0) {
      console.log('📱 No preferences found, using defaults');
      return {
        email_notifications_enabled: true,
        push_notifications_enabled: false,
        sms_notifications_enabled: false
      };
    }

    const preferences = data[0];
    console.log('✅ Preferences loaded:', preferences);
    
    return {
      email_notifications_enabled: preferences.email_notifications_enabled ?? true,
      push_notifications_enabled: preferences.push_notifications_enabled ?? false,
      sms_notifications_enabled: preferences.sms_notifications_enabled ?? false,
      push_endpoint: preferences.push_endpoint,
      push_p256dh: preferences.push_p256dh,
      push_auth: preferences.push_auth
    };
  } catch (error) {
    console.error('❌ Error in loadPreferences:', error);
    throw error;
  }
}

/**
 * Save notification preferences to database
 */
export async function savePreferences(
  preferences: NotificationPreferences,
  pushKeys?: PushSubscriptionKeys
): Promise<NotificationPreferences> {
  try {
    console.log('💾 Saving notification preferences:', preferences);
    
    const { data, error } = await supabase.rpc('set_notification_preferences', {
      email_enabled: preferences.email_notifications_enabled,
      push_enabled: preferences.push_notifications_enabled,
      sms_enabled: preferences.sms_notifications_enabled,
      push_endpoint: pushKeys?.endpoint || null,
      push_p256dh: pushKeys?.p256dh || null,
      push_auth: pushKeys?.auth || null
    });

    if (error) {
      console.error('❌ Error saving preferences:', error);
      throw new Error(`Failed to save preferences: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from save operation');
    }

    const result = data[0];
    console.log('✅ Preferences saved successfully:', result);
    
    return {
      email_notifications_enabled: result.email_notifications_enabled,
      push_notifications_enabled: result.push_notifications_enabled,
      sms_notifications_enabled: result.sms_notifications_enabled,
      ...pushKeys
    };
  } catch (error) {
    console.error('❌ Error in savePreferences:', error);
    throw error;
  }
}

/**
 * Ensure user has a preferences row (create if missing)
 */
export async function ensurePreferencesRow(): Promise<void> {
  try {
    console.log('🔧 Ensuring preferences row exists...');
    
    // Try to load preferences first
    const preferences = await loadPreferences();
    
    // If we got defaults, it means no row exists, so create one
    if (!preferences.email_notifications_enabled && 
        !preferences.push_notifications_enabled && 
        !preferences.sms_notifications_enabled) {
      
      console.log('🔨 Creating default preferences row...');
      await savePreferences({
        email_notifications_enabled: true,
        push_notifications_enabled: false,
        sms_notifications_enabled: false
      });
    }
    
    console.log('✅ Preferences row ensured');
  } catch (error) {
    console.error('❌ Error ensuring preferences row:', error);
    throw error;
  }
}

/**
 * Register for push notifications
 */
export async function registerForPush(): Promise<PushSubscriptionKeys> {
  try {
    console.log('🔔 Registering for push notifications...');
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      throw new Error('Push notifications are not supported in this browser');
    }

    // Check current permission
    if (Notification.permission === 'denied') {
      throw new Error('Push notifications are blocked. Please enable them in your browser settings.');
    }

    // Request permission if needed
    if (Notification.permission === 'default') {
      console.log('📱 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Push notification permission was denied');
      }
    }

    console.log('✅ Notification permission granted');

    // Register service worker
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    console.log('🔧 Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    
    console.log('✅ Service worker registered');

    // Create push subscription
    if (!('PushManager' in window)) {
      throw new Error('Push messaging is not supported in this browser');
    }

    console.log('🔐 Creating push subscription...');
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription with application server key
      // Note: In production, you would use your VAPID public key here
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: null // Use your VAPID public key in production
      });
    }

    if (!subscription) {
      throw new Error('Failed to create push subscription');
    }

    // Extract keys
    const keys = subscription.getKey ? {
      p256dh: subscription.getKey('p256dh'),
      auth: subscription.getKey('auth')
    } : null;

    if (!keys || !keys.p256dh || !keys.auth) {
      throw new Error('Failed to extract push subscription keys');
    }

    // Convert keys to base64url
    const pushKeys: PushSubscriptionKeys = {
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64Url(keys.p256dh),
      auth: arrayBufferToBase64Url(keys.auth)
    };

    console.log('✅ Push subscription created:', {
      endpoint: pushKeys.endpoint.substring(0, 50) + '...',
      hasP256dh: !!pushKeys.p256dh,
      hasAuth: !!pushKeys.auth
    });

    return pushKeys;
  } catch (error) {
    console.error('❌ Error registering for push:', error);
    throw error;
  }
}

/**
 * Unregister from push notifications
 */
export async function unregisterFromPush(): Promise<void> {
  try {
    console.log('🔕 Unregistering from push notifications...');
    
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('✅ Push subscription removed');
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error unregistering from push (non-critical):', error);
    // Don't throw - this is non-critical for the user experience
  }
}

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}