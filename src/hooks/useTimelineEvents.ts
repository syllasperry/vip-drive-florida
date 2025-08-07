
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: number;
  booking_id: string;
  passenger_id: string | null;
  driver_id: string | null;
  status: string;
  system_message: string | null;
  created_at: string;
}

interface UseTimelineEventsOptions {
  bookingId: string | null;
  enabled?: boolean;
}

export const useTimelineEvents = ({ bookingId, enabled = true }: UseTimelineEventsOptions) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
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
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching timeline events:', err);
      setError('Failed to fetch timeline events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [bookingId, enabled]);

  // Real-time subscription for timeline_events
  useEffect(() => {
    if (!bookingId || !enabled) return;

    const channel = supabase
      .channel(`timeline-events-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_events',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Timeline events update:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, enabled]);

  return {
    events,
    loading,
    error,
    refresh: fetchEvents
  };
};
