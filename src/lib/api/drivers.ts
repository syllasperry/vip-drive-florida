
import type { SupabaseClient } from '@supabase/supabase-js';

export async function fetchDriversForBooking(supabase: SupabaseClient, bookingId: string) {
  console.log('[DRIVERS][FETCH_FOR_BOOKING]', { bookingId });
  const { data, error } = await supabase.rpc('drivers_for_booking', { bookingid: bookingId });
  if (error) {
    console.error('[DRIVERS][FETCH_FOR_BOOKING][ERROR]', error);
    throw new Error(error.message);
  }
  return data ?? [];
}
