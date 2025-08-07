
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  booking_id: string;
  passenger_id: string;
  driver_id: string;
  status: string;
  system_message: string;
  created_at: string;
}

interface UseBookingTimelineOptions {
  bookingId: string | null;
  enabled?: boolean;
}

export const useBookingTimeline = ({ bookingId, enabled = true }: UseBookingTimelineOptions) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = async () => {
    if (!bookingId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTimelineEvents(data || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError('Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [bookingId, enabled]);

  // Real-time subscription for timeline updates
  useEffect(() => {
    if (!bookingId || !enabled) return;

    const channel = supabase
      .channel(`timeline-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_events',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Timeline update:', payload);
          fetchTimeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, enabled]);

  return {
    timelineEvents,
    loading,
    error,
    refresh: fetchTimeline
  };
};
