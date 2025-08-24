
// Push notification service for browser push notifications
export interface NotificationPayload {
  title: string;
  body: string;
  type: 'ride_status' | 'system' | 'message';
  bookingId?: string;
  userId?: string;
  userType?: 'passenger' | 'driver' | 'dispatcher';
  requireInteraction?: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('📱 Service Worker registered for push notifications');
      } catch (error) {
        console.warn('❌ Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('❌ This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendNotification(payload: NotificationPayload) {
    // For now, use browser notifications as push notifications require server setup
    if (Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/vip-logo.jpg',
        badge: '/vip-logo.jpg',
        requireInteraction: payload.requireInteraction || false,
        data: {
          type: payload.type,
          bookingId: payload.bookingId,
          userId: payload.userId,
          userType: payload.userType
        }
      });
    }
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const pushNotificationService = new PushNotificationService();
