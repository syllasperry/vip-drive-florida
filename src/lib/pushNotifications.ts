import { supabase } from "@/integrations/supabase/client";

export interface NotificationPayload {
  title: string;
  body: string;
  type: 'ride_status' | 'message' | 'system';
  url?: string;
  bookingId?: string;
  userId: string;
  userType: 'passenger' | 'driver';
  icon?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushNotificationService {
  private vapidKey = 'BKqJ4JY8Zx7ZxKkKXk7J9YzJ6Y8KxKqJ4JY8Zx7ZxKkKXk7J9YzJ6Y8KxKqJ4JY8Zx7ZxKkKXk7J9YzJ6Y8Kx'; // Replace with actual VAPID key
  
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await this.registerServiceWorker();
      await this.subscribeToPush();
    }
    
    return permission;
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'NAVIGATE') {
        window.location.href = event.data.url;
      } else if (event.data.type === 'SYNC_NOTIFICATIONS') {
        // Handle notification sync when back online
        this.syncPendingNotifications();
      }
    });
    
    return registration;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidKey)
      });

      // Save subscription to Supabase
      await this.saveSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async saveSubscription(subscription: PushSubscription): Promise<void> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    await supabase.from('push_subscriptions').upsert({
      user_id: user.data.user.id,
      subscription: JSON.stringify(subscription),
      endpoint: subscription.endpoint,
      updated_at: new Date().toISOString()
    });
  }

  async unsubscribe(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from Supabase
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.data.user.id);
        }
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: payload
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  async checkNotificationSupport(): Promise<boolean> {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async getNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async syncPendingNotifications(): Promise<void> {
    // Sync any pending notifications when back online
    console.log('Syncing pending notifications...');
  }

  // Predefined notification templates
  static getNotificationTemplate(type: string, data: any): Partial<NotificationPayload> {
    switch (type) {
      case 'driver_heading_to_pickup':
        return {
          title: 'VIP Drive',
          body: 'Your driver is on the way to pick you up',
          type: 'ride_status',
          url: `/passenger/dashboard?tab=bookings&booking=${data.bookingId}`,
          requireInteraction: true
        };
      
      case 'driver_arrived':
        return {
          title: 'VIP Drive',
          body: 'Your driver has arrived at the pickup location',
          type: 'ride_status',
          url: `/passenger/dashboard?tab=bookings&booking=${data.bookingId}`,
          requireInteraction: true
        };

      case 'ride_completed':
        return {
          title: 'VIP Drive',
          body: 'Your ride has been completed. Please rate your experience!',
          type: 'ride_status',
          url: `/passenger/dashboard?tab=bookings&booking=${data.bookingId}`,
          requireInteraction: true
        };

      case 'new_message':
        return {
          title: `New message from ${data.senderName}`,
          body: data.messagePreview,
          type: 'message',
          url: `/dashboard?tab=messages&booking=${data.bookingId}`,
          requireInteraction: false
        };

      case 'booking_accepted':
        return {
          title: 'VIP Drive',
          body: 'Your booking has been accepted by a driver',
          type: 'system',
          url: `/passenger/dashboard?tab=bookings&booking=${data.bookingId}`,
          requireInteraction: true
        };

      case 'payment_confirmed':
        return {
          title: 'VIP Drive',
          body: 'Payment confirmed. Your ride is all set!',
          type: 'system',
          url: `/passenger/dashboard?tab=bookings&booking=${data.bookingId}`,
          requireInteraction: false
        };

      default:
        return {
          title: 'VIP Drive',
          body: 'You have a new update',
          type: 'system',
          url: '/dashboard'
        };
    }
  }
}

export const pushNotificationService = new PushNotificationService();