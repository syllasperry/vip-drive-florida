
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Listen for notifications in notification_outbox
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_outbox',
          filter: userType === 'passenger' 
            ? `recipient_passenger_id=eq.${userId}`
            : `recipient_driver_id=eq.${userId}`
        },
        (payload) => {
          console.log('📱 New notification received:', payload);
          
          const notification = payload.new;
          
          if (notification.type === 'offer_received') {
            toast({
              title: "New Offer Received!",
              description: "A driver has sent you a price offer.",
            });
          }
          
          onNotificationReceived(notification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, userType, onNotificationReceived, toast]);

  return null;
};
