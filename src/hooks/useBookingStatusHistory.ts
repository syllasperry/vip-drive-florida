import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BookingStatusHistoryEntry {
  id: any;
  booking_id: string;
  status: string;
  updated_at: string;
  updated_by?: string;
  role?: string;
  notes?: string;
  metadata?: any;
}

interface UseBookingStatusHistoryOptions {
  bookingId: string | null;
  enabled?: boolean;
}

export const useBookingStatusHistory = ({ bookingId, enabled = true }: UseBookingStatusHistoryOptions) => {
  const [statusHistory, setStatusHistory] = useState<BookingStatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch status history
  const fetchStatusHistory = async () => {
    if (!bookingId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('booking_status_history')
        .select('*')
        .eq('booking_id', bookingId)
        .order('updated_at', { ascending: true });

      if (error) throw error;

      setStatusHistory((data || []) as any[]);
    } catch (err) {
      console.error('Error fetching booking status history:', err);
      setError('Failed to fetch status history');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStatusHistory();
  }, [bookingId, enabled]);

  // Real-time subscription for status history updates
  useEffect(() => {
    if (!bookingId || !enabled) return;

    const channel = supabase
      .channel(`booking-status-history-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_status_history',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          console.log('📡 Real-time booking status history update:', payload);
          fetchStatusHistory(); // Refresh data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, enabled]);

  // Create new status entry
  const createStatusEntry = async (
    status: string,
    role?: 'driver' | 'passenger',
    notes?: string,
    metadata?: any
  ) => {
    if (!bookingId) throw new Error('No booking ID provided');

    const { data, error } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status,
        role,
        notes,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    statusHistory,
    loading,
    error,
    refresh: fetchStatusHistory,
    createStatusEntry
  };
};