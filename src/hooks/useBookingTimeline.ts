
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useBookingTimeline = (bookingId: string) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setTimeline(data || []);
      } catch (error) {
        console.error('Error fetching timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchTimeline();
    }
  }, [bookingId]);

  return { timeline, loading };
};
