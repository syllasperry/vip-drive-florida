
import { supabase } from "@/integrations/supabase/client";

export interface BookingData {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  status: string;
  ride_status?: string;
  payment_confirmation_status?: string;
  status_passenger?: string;
  status_driver?: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  updated_at: string;
  passenger_id: string;
  driver_id?: string;
  passenger_name?: string;
  passenger_email?: string;
  passenger_phone?: string;
  passenger_photo_url?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  driver_photo_url?: string;
  driver_car_make?: string;
  driver_car_model?: string;
  driver_license_plate?: string;
}

export interface DispatcherBookingData {
  booking_id: string;
  status: string;
  pickup_time: string;
  passenger_name: string;
  passenger_phone: string;
  driver_name?: string;
  driver_phone?: string;
  created_at: string;
  pickup_location: string;
  dropoff_location: string;
  estimated_price?: number;
  final_price?: number;
}

export async function getBookings(): Promise<BookingData[]> {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        pickup_location,
        dropoff_location,
        pickup_time,
        passenger_count,
        status,
        ride_status,
        payment_confirmation_status,
        status_passenger,
        status_driver,
        estimated_price,
        final_price,
        created_at,
        updated_at,
        passenger_id,
        driver_id,
        passengers (
          full_name,
          phone,
          email,
          profile_photo_url
        ),
        drivers (
          full_name,
          phone,
          email,
          profile_photo_url,
          car_make,
          car_model,
          license_plate
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }

    // Enhanced type safety: Map the data to the BookingData type
    const typedBookings: BookingData[] = bookings.map(booking => ({
      id: booking.id,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      pickup_time: booking.pickup_time,
      passenger_count: booking.passenger_count,
      status: booking.status,
      ride_status: booking.ride_status,
      payment_confirmation_status: booking.payment_confirmation_status,
      status_passenger: booking.status_passenger,
      status_driver: booking.status_driver,
      estimated_price: booking.estimated_price,
      final_price: booking.final_price,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      passenger_id: booking.passenger_id,
      driver_id: booking.driver_id,
      passenger_name: booking.passengers?.full_name,
      passenger_email: booking.passengers?.email,
      passenger_phone: booking.passengers?.phone,
      passenger_photo_url: booking.passengers?.profile_photo_url,
      driver_name: booking.drivers?.full_name,
      driver_phone: booking.drivers?.phone,
      driver_email: booking.drivers?.email,
      driver_photo_url: booking.drivers?.profile_photo_url,
      driver_car_make: booking.drivers?.car_make,
      driver_car_model: booking.drivers?.car_model,
      driver_license_plate: booking.drivers?.license_plate,
    }));

    return typedBookings;
  } catch (error) {
    console.error('Unexpected error in getBookings:', error);
    throw error;
  }
}

export async function getDispatcherBookings(): Promise<DispatcherBookingData[]> {
  try {
    console.log('Fetching dispatcher bookings from bookings table...');
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        status,
        pickup_time,
        created_at,
        pickup_location,
        dropoff_location,
        estimated_price,
        final_price,
        passengers (
          full_name,
          phone
        ),
        drivers (
          full_name,
          phone
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching dispatcher bookings:', error);
      throw error;
    }

    console.log('Dispatcher bookings data:', data);
    
    // Map to DispatcherBookingData format
    const mappedData: DispatcherBookingData[] = (data || []).map(booking => ({
      booking_id: booking.id,
      status: booking.status,
      pickup_time: booking.pickup_time,
      passenger_name: booking.passengers?.full_name || 'Unknown',
      passenger_phone: booking.passengers?.phone || '',
      driver_name: booking.drivers?.full_name,
      driver_phone: booking.drivers?.phone,
      created_at: booking.created_at,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      estimated_price: booking.estimated_price,
      final_price: booking.final_price
    }));

    return mappedData;
  } catch (error) {
    console.error('Unexpected error in getDispatcherBookings:', error);
    throw error;
  }
}

export const subscribeToBookingsAndPassengers = (callback: () => void) => {
  const channel = supabase
    .channel('bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'passengers' }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const createBooking = async (bookingData: any) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBookingStatus = async (bookingId: string, status: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBookingById = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passengers(*),
      drivers(*)
    `)
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data;
};
