
import { supabase } from '@/integrations/supabase/client';

export type BookingTimelineEvent = {
  id?: string | number;
  booking_id: string;
  status: string;
  role?: string | null;
  changed_by?: string | null;
  created_at: string;
  metadata?: Record<string, any> | null;
};

// Fetch booking timeline events
export async function fetchBookingTimeline(bookingId: string): Promise<BookingTimelineEvent[]> {
  try {
    console.log('📊 Fetching booking timeline for:', bookingId);
    
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching booking timeline:', error);
      throw error;
    }

    console.log('✅ Timeline events fetched:', data?.length || 0);
    
    return (data || []).map(entry => ({
      id: entry.id,
      booking_id: entry.booking_id,
      status: entry.status,
      role: entry.role,
      changed_by: entry.updated_by || entry.changed_by,
      created_at: entry.created_at,
      metadata: entry.metadata || {}
    }));
  } catch (error) {
    console.error('❌ Error in fetchBookingTimeline:', error);
    throw error;
  }
}

// Subscribe to timeline changes
export function subscribeToBookingTimeline(
  bookingId: string, 
  onUpdate: (events: BookingTimelineEvent[]) => void
): () => void {
  console.log('🔔 Setting up timeline subscription for booking:', bookingId);
  
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
        console.log('📡 Timeline update received:', payload);
        // Refetch all events when any change occurs
        fetchBookingTimeline(bookingId)
          .then(onUpdate)
          .catch(console.error);
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 Cleaning up timeline subscription');
    supabase.removeChannel(channel);
  };
}

// Add a new timeline event (for manual tracking if needed)
export async function addTimelineEvent(
  bookingId: string,
  status: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status,
        metadata: metadata || {},
        updated_by: (await supabase.auth.getUser()).data.user?.id,
        role: 'system' // can be overridden in metadata
      });

    if (error) {
      console.error('❌ Error adding timeline event:', error);
      throw error;
    }

    console.log('✅ Timeline event added:', { bookingId, status });
  } catch (error) {
    console.error('❌ Error in addTimelineEvent:', error);
    throw error;
  }
}
