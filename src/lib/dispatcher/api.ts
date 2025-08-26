
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/lib/types/booking';

export interface BookingHistoryEntry {
  status: string;
  metadata?: any;
  created_at: string;
  role?: string;
  changed_by?: string;
}

// Fetch booking history for a specific booking
export async function fetchBookingHistory(bookingId: string): Promise<BookingHistoryEntry[]> {
  try {
    console.log('📊 Fetching booking history for dispatcher:', bookingId);
    
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('status, metadata, created_at, role, changed_by')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching booking history:', error);
      return [];
    }

    console.log('✅ Successfully fetched booking history:', data?.length || 0);
    
    return (data || []).map(entry => ({
      status: entry.status as string,
      metadata: entry.metadata || {},
      created_at: entry.created_at,
      role: entry.role,
      changed_by: entry.changed_by
    }));
  } catch (error) {
    console.error('❌ Error in fetchBookingHistory:', error);
    return [];
  }
}

// Subscribe to booking history changes
export function subscribeBookingHistory(bookingId: string, onChange: (history: BookingHistoryEntry[]) => void): () => void {
  console.log('🔔 Setting up dispatcher booking history subscription for:', bookingId);
  
  const channel = supabase
    .channel(`dispatcher-booking-history-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'booking_status_history',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        console.log('📡 Dispatcher booking history update received:', payload);
        // Refetch history when any change occurs
        fetchBookingHistory(bookingId)
          .then(onChange)
          .catch(console.error);
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 Cleaning up dispatcher booking history subscription');
    supabase.removeChannel(channel);
  };
}

// Fetch dispatcher bookings
export async function fetchDispatcherBookings(): Promise<Booking[]> {
  try {
    console.log('📊 Fetching dispatcher bookings');
    
    // Use the existing API function instead of direct RPC call
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        passenger:passengers(name, phone, email, image_url),
        driver:drivers(name, phone, image_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching dispatcher bookings:', error);
      return [];
    }

    console.log('✅ Successfully fetched dispatcher bookings:', data?.length || 0);

    // Map result to Booking interface with proper type handling
    const bookings: Booking[] = (data || []).map((row: any) => ({
      id: row.id,
      booking_code: row.booking_code || '',
      pickup_time: row.pickup_time,
      pickup_location: row.pickup_location,
      dropoff_location: row.dropoff_location,
      status: row.status,
      payment_status: row.payment_status || 'pending',
      price_cents: row.price_cents,
      currency: row.currency || 'USD',
      passenger_name: row.passenger?.name || '',
      passenger_phone: row.passenger?.phone || '',
      passenger_email: row.passenger?.email || '',
      passenger_photo_url: row.passenger?.image_url || null,
      passenger_id: row.passenger_id,
      driver_id: row.driver_id,
      driver_name: row.driver?.name || '',
      driver_phone: row.driver?.phone || '',
      driver_photo_url: row.driver?.image_url || null,
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at
    }));
    
    return bookings;
  } catch (error) {
    console.error('❌ Error in fetchDispatcherBookings:', error);
    return [];
  }
}
