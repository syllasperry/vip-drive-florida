
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationListenerProps {
  userId: string;
  userType: 'passenger' | 'driver';
  onNotificationReceived: (notification: any) => void;
}

export const NotificationListener = ({
  userId,
  userType,
  onNotificationReceived
}: NotificationListenerProps) => {

  useEffect(() => {
    if (!userId) return;

    // Listen to booking_status_history changes for real-time notifications
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_status_history'
        },
        (payload) => {
          console.log('🔔 New status change detected:', payload);
          
          // Simulate notification based on status change
          if (payload.new) {
            const notification = {
              type: payload.new.status === 'offer_sent' ? 'offer_received' : 'status_update',
              payload: payload.new,
              booking_id: payload.new.booking_id
            };
            
            onNotificationReceived(notification);
          }
        }
      )
      .subscribe();

    console.log('👂 Notification listener started for user:', userId);

    return () => {
      console.log('🔇 Notification listener stopped');
      supabase.removeChannel(channel);
    };
  }, [userId, onNotificationReceived]);

  return null; // This is a logic-only component
};
