
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
    // Use the existing RPC that works for passengers
    const { data, error } = await supabase.rpc('get_passenger_bookings_by_auth');
    
    if (error) {
      console.error('Error fetching passenger cards:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
    
    // Map the RPC result to our CardDTO format
    return (data || []).map((booking: any) => ({
      booking_id: booking.booking_id,
      booking_code: booking.booking_code || booking.booking_id?.slice(0, 8),
      status: booking.status,
      passenger_name: booking.passenger_name,
      passenger_avatar_url: booking.passenger_photo_url,
      driver_name: booking.driver_name,
      driver_avatar_url: booking.driver_photo_url,
      price_dollars: booking.final_price || booking.estimated_price,
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
      price_dollars: data.final_price || data.estimated_price,
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

export async function requestCheckout(bookingId: string): Promise<void> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error('No active session');
    }

    const response = await fetch(
      'https://extdyjkfgftbokabiamc.supabase.co/functions/v1/stripe-start-checkout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({ booking_id: bookingId })
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    if (result.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (error) {
    console.error('Error requesting checkout:', error);
    throw error;
  }
}
