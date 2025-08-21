
import { supabase } from "@/integrations/supabase/client";

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

export async function fetchMyCards(): Promise<CardDTO[]> {
  try {
    // Use direct table query since the view may not be available in types
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        status,
        pickup_location,
        dropoff_location,
        pickup_time,
        vehicle_type,
        estimated_price_cents,
        final_price_cents,
        created_at,
        updated_at,
        passengers (
          full_name,
          profile_photo_url
        ),
        drivers (
          full_name,
          profile_photo_url
        )
      `)
      .eq('passenger_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching passenger cards:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
    
    // Map the result to our CardDTO format
    return (data || []).map((booking: any) => ({
      booking_id: booking.id,
      booking_code: booking.booking_code || booking.id?.slice(0, 8),
      status: booking.status,
      passenger_name: booking.passengers?.full_name,
      passenger_avatar_url: booking.passengers?.profile_photo_url,
      driver_name: booking.drivers?.full_name,
      driver_avatar_url: booking.drivers?.profile_photo_url,
      price_dollars: (booking.final_price_cents || booking.estimated_price_cents) ? 
        ((booking.final_price_cents || booking.estimated_price_cents) / 100) : undefined,
      currency: 'USD',
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      pickup_time: booking.pickup_time,
      vehicle_type: booking.vehicle_type,
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }));
  } catch (error) {
    console.error('Unexpected error fetching cards:', error);
    throw error;
  }
}

export async function fetchBookingDetail(bookingId: string): Promise<DetailDTO | null> {
  try {
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
      console.error('Error fetching booking detail:', error);
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
      price_dollars: (data.final_price_cents || data.estimated_price_cents) ?
        ((data.final_price_cents || data.estimated_price_cents) / 100) : undefined,
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
    console.error('Unexpected error fetching booking detail:', error);
    return null;
  }
}

export function subscribeMyBookings(onChange: () => void): () => void {
  console.log('Setting up real-time subscription for passenger bookings...');
  
  const channel = supabase
    .channel("passenger-bookings")
    .on("postgres_changes", { 
      event: "*", 
      schema: "public", 
      table: "bookings" 
    }, (payload) => {
      console.log('Real-time booking update received:', payload);
      onChange();
    })
    .subscribe((status) => {
      console.log('Real-time subscription status:', status);
    });
  
  return () => {
    console.log('Cleaning up real-time subscription');
    supabase.removeChannel(channel);
  };
}
