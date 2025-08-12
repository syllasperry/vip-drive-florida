
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  status: string;
  timestamp: string;
  actor_role: string;
  system_message?: string;
}

export const useBookingTimeline = (bookingId: string) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!bookingId) return;
      
      try {
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTimeline(data || []);
      } catch (error) {
        console.error('Error fetching booking timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [bookingId]);

  return { timeline, loading };
};
