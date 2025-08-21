
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/lib/types/booking';

// Fetch passenger bookings using the new RPC function
export async function fetchMyBookings(): Promise<Booking[]> {
  try {
    console.log('📊 Fetching passenger bookings via RPC');
    
    const { data, error } = await supabase.rpc('get_my_passenger_bookings');

    if (error) {
      console.error('❌ Error fetching passenger bookings:', error);
      return [];
    }

    console.log('✅ Successfully fetched passenger bookings:', data?.length || 0);

    // Map RPC result to Booking interface
    const bookings: Booking[] = (data || []).map((row: any) => ({
      id: row.booking_id,
      booking_code: row.booking_code || '',
      pickup_time: row.pickup_time,
      pickup_location: row.pickup_location,
      dropoff_location: row.dropoff_location,
      vehicle_type: row.vehicle_type,
      status: row.status,
      payment_status: row.payment_status,
      price_cents: row.price_cents,
      currency: row.currency || 'USD',
      passenger_first_name: row.passenger_name?.split(' ')[0] || null,
      passenger_last_name: row.passenger_name?.split(' ').slice(1).join(' ') || null,
      passenger_name: row.passenger_name || '',
      passenger_photo_url: row.passenger_avatar_url,
      passenger_phone: row.passenger_phone,
      passenger_email: row.passenger_email,
      passenger_id: '', // Will be filled by the backend
      driver_id: row.driver_id,
      driver_name: row.driver_name,
      driver_full_name: row.driver_name,
      driver_phone: row.driver_phone,
      driver_photo_url: row.driver_avatar_url,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    return bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('❌ Error in fetchMyBookings:', error);
    return [];
  }
}

// Real-time subscription for passenger bookings
export function subscribeMyBookings(onChange: () => void): () => void {
  console.log('🔔 Setting up real-time subscription for passenger bookings');
  
  const channel = supabase
    .channel('passenger_bookings')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings'
      },
      (payload) => {
        console.log('📡 Real-time passenger booking update:', payload);
        onChange();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'passengers'
      },
      (payload) => {
        console.log('📡 Real-time passenger profile update:', payload);
        onChange();
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 Cleaning up passenger bookings subscription');
    supabase.removeChannel(channel);
  };
}
