import { supabase } from "@/integrations/supabase/client";

export const getBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getDispatcherBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passengers:passenger_id(*),
      drivers:driver_id(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const sendOffer = async (bookingId: string, driverId: string, price: number) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      driver_id: driverId,
      final_price: price,
      status: 'offer_sent',
      ride_status: 'offer_sent',
      payment_confirmation_status: 'price_awaiting_acceptance'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const confirmPayment = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      payment_confirmation_status: 'payment_confirmed',
      status: 'confirmed',
      ride_status: 'confirmed'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const startRide = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'in_progress',
      ride_status: 'driver_en_route'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const arrivedAtPickup = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ride_status: 'driver_arrived'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const beginTrip = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ride_status: 'in_progress'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const completeTrip = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'completed',
      ride_status: 'completed'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const cancelBooking = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      ride_status: 'cancelled'
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
