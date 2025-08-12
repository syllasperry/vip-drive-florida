
import type { SupabaseClient } from '@supabase/supabase-js';

export async function fetchDriversForBooking(supabase: SupabaseClient, bookingId: string) {
  console.log('[DRIVERS][FETCH_FOR_BOOKING]', { bookingId });
  
  // Ensure we're passing a valid UUID
  if (!bookingId || typeof bookingId !== 'string') {
    console.error('[DRIVERS][FETCH_FOR_BOOKING][INVALID_ID]', { bookingId });
    throw new Error('Invalid booking ID provided');
  }
  
  const { data, error } = await supabase.rpc('drivers_for_booking', { bookingid: bookingId });
  
  console.log('[DRIVERS][FETCH_FOR_BOOKING][RESPONSE]', { data, error, bookingId });
  
  if (error) {
    console.error('[DRIVERS][FETCH_FOR_BOOKING][ERROR]', error);
    throw new Error(error.message);
  }
  
  return data ?? [];
}
