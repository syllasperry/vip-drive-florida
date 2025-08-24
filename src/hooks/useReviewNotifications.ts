
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ReviewNotification {
  id: string;
  booking_id: string;
  scheduled_for: string;
  sent_at: string | null;
  review_submitted: boolean;
  booking?: {
    booking_code: string;
    pickup_time: string;
    vehicle_type: string;
    drivers?: {
      full_name: string;
    };
  };
}

export const useReviewNotifications = () => {
  return useQuery({
    queryKey: ['review-notifications'],
    queryFn: async () => {
      console.log('🔔 Fetching review notifications...');
      
      const { data: notifications, error } = await supabase
        .from('review_notifications')
        .select(`
          *,
          bookings!inner(
            booking_code,
            pickup_time,
            vehicle_type,
            drivers(full_name)
          )
        `)
        .eq('review_submitted', false)
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: false });

      if (error) {
        console.error('❌ Error fetching review notifications:', error);
        throw error;
      }

      console.log('✅ Review notifications fetched:', notifications?.length || 0);
      return (notifications || []) as ReviewNotification[];
    },
    staleTime: 30000,
    refetchOnWindowFocus: false
  });
};

export const useMarkReviewNotificationSent = () => {
  return async (notificationId: string) => {
    const { error } = await supabase
      .from('review_notifications')
      .update({ 
        sent_at: new Date().toISOString(),
        review_submitted: true 
      })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Error marking review notification as sent:', error);
      throw error;
    }

    console.log('✅ Review notification marked as sent');
  };
};
