
import { supabase } from "@/integrations/supabase/client";

// Updated types to match the requirements
export interface PassengerBooking {
  id: string;
  booking_code: string | null;
  pickup_time: string | null;        // ISO
  pickup_location: string | null;
  dropoff_location: string | null;
  vehicle_type: string | null;
  status: string;                    // pending | offered | paid | assigned | ...
  payment_status: string | null;     // unpaid | paid | ...
  final_price_cents: number | null;
  passenger_first_name: string | null;
  passenger_last_name: string | null;
  passenger_photo_url?: string | null;
  driver_full_name?: string | null;
  driver_photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy CardDTO for backward compatibility
export interface CardDTO {
  booking_id: string;
  booking_code?: string;
  status: string;
  passenger_name?: string;
  passenger_avatar_url?: string;
  driver_name?: string;
  driver_avatar_url?: string;
  price_dollars?: number;
  currency?: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_time?: string;
  vehicle_type?: string;
  created_at?: string;
  updated_at?: string;
}

// Legacy DetailDTO for backward compatibility
export interface DetailDTO {
  booking_id: string;
  booking_code?: string;
  status: string;
  passenger_name?: string;
  passenger_avatar_url?: string;
  driver_name?: string;
  driver_avatar_url?: string;
  driver_phone?: string;
  price_dollars?: number;
  currency?: string;
  pickup_location?: string;
  dropoff_location?: string;
  pickup_time?: string;
  vehicle_type?: string;
  distance_miles?: number;
  created_at?: string;
  updated_at?: string;
}

// RPC-based fetch using the new type
export async function fetchMyBookings(): Promise<PassengerBooking[]> {
  try {
    console.log('🔄 Fetching passenger bookings via RPC...');
    
    const { data, error } = await supabase.rpc('get_my_passenger_bookings');
    
    if (error) {
      console.error('❌ RPC error:', error);
      throw error;
    }
    
    console.log('✅ RPC bookings fetched:', Array.isArray(data) ? data.length : 0, 'bookings');
    
    // Ensure array and stable shape
    const bookings = (data ?? []) as PassengerBooking[];
    
    // Sort by created_at descending (newest first)
    return bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('❌ fetchMyBookings error:', error);
    throw error;
  }
}

// Real-time subscription helper
export function subscribeMyBookings(onChange: () => void) {
  console.log('🔄 Setting up real-time subscription for passenger bookings...');
  
  const channel = supabase
    .channel('pax-bookings-realtime')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'bookings' 
    }, (payload) => {
      console.log('🔔 Real-time booking update:', payload);
      onChange();
    })
    .subscribe((status) => {
      console.log('📡 Realtime subscription status:', status);
    });
    
  return () => {
    console.log('🔌 Cleaning up real-time subscription');
    supabase.removeChannel(channel);
  };
}

// Legacy function for backward compatibility - now uses RPC
export async function fetchMyCards(): Promise<CardDTO[]> {
  try {
    const bookings = await fetchMyBookings();
    
    // Transform to legacy CardDTO format
    return bookings.map((booking): CardDTO => ({
      booking_id: booking.id,
      booking_code: booking.booking_code || booking.id?.slice(0, 8),
      status: booking.status,
      passenger_name: booking.passenger_first_name && booking.passenger_last_name 
        ? `${booking.passenger_first_name} ${booking.passenger_last_name}`.trim()
        : booking.passenger_first_name || 'VIP Passenger',
      passenger_avatar_url: booking.passenger_photo_url,
      driver_name: booking.driver_full_name,
      driver_avatar_url: booking.driver_photo_url,
      price_dollars: booking.final_price_cents ? booking.final_price_cents / 100 : undefined,
      currency: 'USD',
      pickup_location: booking.pickup_location || '',
      dropoff_location: booking.dropoff_location || '',
      pickup_time: booking.pickup_time || '',
      vehicle_type: booking.vehicle_type || '',
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }));
  } catch (error) {
    console.error('❌ fetchMyCards error:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
export async function fetchBookingDetail(bookingId: string): Promise<DetailDTO | null> {
  try {
    console.log('🔄 Fetching booking detail for:', bookingId);
    
    // Get booking details using the existing bookings table
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers (
          id,
          full_name,
          phone,
          profile_photo_url
        ),
        drivers (
          full_name,
          phone,
          profile_photo_url,
          car_make,
          car_model,
          car_color,
          license_plate
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('❌ Error fetching booking detail:', error);
      return null;
    }

    if (!data) return null;

    return {
      booking_id: data.id,
      booking_code: data.booking_code || data.id?.slice(0, 8),
      status: data.status,
      passenger_name: data.passengers?.full_name,
      passenger_avatar_url: data.passengers?.profile_photo_url,
      driver_name: data.drivers?.full_name,
      driver_avatar_url: data.drivers?.profile_photo_url,
      driver_phone: data.drivers?.phone,
      price_dollars: (data.final_price || data.estimated_price) ?
        (data.final_price || data.estimated_price) : undefined,
      currency: 'USD',
      pickup_location: data.pickup_location,
      dropoff_location: data.dropoff_location,
      pickup_time: data.pickup_time,
      vehicle_type: data.vehicle_type,
      distance_miles: data.distance_miles,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching booking detail:', error);
    return null;
  }
}

// Legacy subscription function - now uses the new implementation
export function subscribeMyBookings(onChange: () => void): () => void {
  return subscribeMyBookings(onChange);
}
