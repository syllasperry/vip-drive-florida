
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  booking_id: string;
  status: string;
  actor_role: string;
  timestamp: string;
  system_message?: string;
}

export const useBookingTimeline = (bookingId: string) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Convert the data to match our interface
        const formattedTimeline: TimelineEvent[] = (data || []).map(item => ({
          id: item.id.toString(),
          booking_id: item.booking_id,
          status: item.status,
          actor_role: 'system', // Default value since it's not in the database
          timestamp: item.created_at,
          system_message: item.system_message
        }));

        setTimeline(formattedTimeline);
      } catch (err) {
        console.error('Error fetching booking timeline:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();

    // Set up real-time subscription
    const channel = supabase
      .channel('timeline_events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'timeline_events',
        filter: `booking_id=eq.${bookingId}`
      }, () => {
        fetchTimeline();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  return { timeline, loading, error };
};
