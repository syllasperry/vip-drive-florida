
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
        
        const mappedTimeline = (data || []).map(item => ({
          id: item.id.toString(),
          status: item.status,
          timestamp: item.created_at,
          actor_role: 'system',
          system_message: item.system_message
        }));
        
        setTimeline(mappedTimeline);
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
