
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimelineEvent {
  id: string;
  booking_id: string;
  status: string;
  created_at: string;
  updated_by: string | null;
  role: string | null;
  metadata: any;
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
      // Use booking_status_history table which exists in the Supabase schema
      const { data, error } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map the data to our TimelineEvent interface
      const mappedData: TimelineEvent[] = (data || []).map(item => ({
        id: item.id.toString(),
        booking_id: item.booking_id,
        status: item.status,
        created_at: item.created_at || new Date().toISOString(),
        updated_by: item.updated_by,
        role: item.role,
        metadata: item.metadata
      }));
      
      setTimelineEvents(mappedData);
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
          table: 'booking_status_history',
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
