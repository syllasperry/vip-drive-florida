
import { useState, useEffect } from 'react';
import { BookingTimelineEvent, fetchBookingTimeline, subscribeToBookingTimeline } from '@/lib/history/api';

export const useBookingHistory = (bookingId: string | null) => {
  const [timeline, setTimeline] = useState<BookingTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setTimeline([]);
      setLoading(false);
      return;
    }

    let cleanup: (() => void) | undefined;

    const loadTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const events = await fetchBookingTimeline(bookingId);
        setTimeline(events);
        
        // Set up real-time subscription
        cleanup = subscribeToBookingTimeline(bookingId, (updatedEvents) => {
          setTimeline(updatedEvents);
        });
        
      } catch (err) {
        console.error('Error loading timeline:', err);
        setError(err instanceof Error ? err.message : 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [bookingId]);

  return { timeline, loading, error };
};
