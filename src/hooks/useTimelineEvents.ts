
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
      // Use booking_status_history as timeline events since timeline_events table is not in types
      const { data, error } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map booking_status_history to TimelineEvent format
      const mappedEvents: TimelineEvent[] = (data || []).map(item => ({
        id: item.id,
        booking_id: item.booking_id,
        passenger_id: null, // Not available in booking_status_history
        driver_id: item.updated_by,
        status: item.status,
        system_message: `Status updated to ${item.status}${item.role ? ` by ${item.role}` : ''}`,
        created_at: item.created_at || new Date().toISOString()
      }));
      
      setEvents(mappedEvents);
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

  // Real-time subscription for booking_status_history changes
  useEffect(() => {
    if (!bookingId || !enabled) return;

    const channel = supabase
      .channel(`timeline-events-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
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
