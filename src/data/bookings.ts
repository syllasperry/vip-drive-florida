
import { supabase } from './supabaseClient';

export const getAllBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  return data;
};

export const listenForBookingChanges = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        console.log('Change received!', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Return a cleanup function that properly unsubscribes
  return () => {
    supabase.removeChannel(channel);
  };
};
