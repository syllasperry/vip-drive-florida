
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useReviewNotifications } from './useReviewNotifications';

export const useReviewScheduler = () => {
  const { notifications } = useReviewNotifications();

  // Process pending review notifications
  useEffect(() => {
    const processReviewNotifications = async () => {
      if (!notifications || notifications.length === 0) return;

      for (const notification of notifications) {
        // Check if notification is due
        const scheduledTime = new Date(notification.scheduled_for);
        const now = new Date();

        if (scheduledTime <= now && !notification.sent_at) {
          console.log('📧 Processing review notification:', notification.id);
          
          try {
            // Send review request via edge function
            await supabase.functions.invoke('send-review-notifications', {
              body: { reviewNotification: notification }
            });

            console.log('✅ Review notification sent successfully');
          } catch (error) {
            console.error('❌ Failed to send review notification:', error);
          }
        }
      }
    };

    // Check every 60 seconds for due notifications
    const interval = setInterval(processReviewNotifications, 60000);
    
    // Also check immediately
    processReviewNotifications();

    return () => clearInterval(interval);
  }, [notifications]);

  // Manual function to schedule review for a booking
  const scheduleReviewNotification = async (bookingId: string, pickupTime: string) => {
    try {
      const reviewTime = new Date(pickupTime);
      reviewTime.setHours(reviewTime.getHours() + 2);

      const { error } = await supabase
        .from('review_notifications')
        .upsert({
          booking_id: bookingId,
          scheduled_for: reviewTime.toISOString(),
          review_submitted: false
        }, { onConflict: 'booking_id' });

      if (error) throw error;

      console.log('✅ Review notification scheduled for:', reviewTime.toLocaleString());
      return true;
    } catch (error) {
      console.error('❌ Failed to schedule review notification:', error);
      return false;
    }
  };

  return {
    scheduleReviewNotification,
    pendingNotifications: notifications
  };
};
