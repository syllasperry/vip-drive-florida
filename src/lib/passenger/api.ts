import { supabase } from '@/integrations/supabase/client';

// Booking interface for passenger data
export interface PassengerBooking {
  id: string;
  booking_code: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  vehicle_type: string | null;
  status: string | null;
  payment_status: string | null;
  final_price_cents: number | null;
  passenger_first_name: string | null;
  passenger_last_name: string | null;
  passenger_photo_url: string | null;
  driver_full_name: string | null;
  driver_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

// Legacy DTOs for backward compatibility
export interface CardDTO {
  id: string;
  bookingId: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  status: string;
  paymentStatus: string;
  finalPrice: number | null;
  passengerName: string;
  passengerPhoto: string | null;
  driverName: string | null;
  driverPhoto: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetailDTO {
  id: string;
  bookingCode: string;
  pickupTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  vehicleType: string;
  status: string;
  paymentStatus: string;
  finalPrice: number | null;
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    photoUrl: string | null;
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    photoUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// Fetch passenger bookings
export async function fetchMyBookings(): Promise<PassengerBooking[]> {
  try {
    console.log('📊 Fetching passenger bookings');
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        code,
        pickup_time,
        pickup_location,
        dropoff_location,
        vehicle_type,
        status,
        payment_status,
        final_price_cents,
        passenger_first_name,
        passenger_last_name,
        passenger_photo_url,
        created_at,
        updated_at,
        drivers!driver_id(
          full_name,
          avatar_url
        )
      `)
      .order('pickup_time', { ascending: false });

    if (error) {
      console.error('❌ Error fetching passenger bookings:', error);
      throw error;
    }

    console.log('✅ Successfully fetched passenger bookings:', data?.length || 0);

    const bookings: PassengerBooking[] = (data || []).map(booking => ({
      id: booking.id,
      booking_code: booking.code || '',
      pickup_time: booking.pickup_time,
      pickup_location: booking.pickup_location,
      dropoff_location: booking.dropoff_location,
      vehicle_type: booking.vehicle_type,
      status: booking.status,
      payment_status: booking.payment_status,
      final_price_cents: booking.final_price_cents,
      passenger_first_name: booking.passenger_first_name,
      passenger_last_name: booking.passenger_last_name,
      passenger_photo_url: booking.passenger_photo_url,
      driver_full_name: booking.drivers?.full_name || null,
      driver_photo_url: booking.drivers?.avatar_url || null,
      created_at: booking.created_at,
      updated_at: booking.updated_at
    }));
    
    return bookings;
  } catch (error) {
    console.error('❌ Error in fetchMyBookings:', error);
    throw error;
  }
}

// Real-time subscription
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
    .subscribe();

  return () => {
    console.log('🔕 Cleaning up passenger bookings subscription');
    supabase.removeChannel(channel);
  };
}

// Legacy function for CardDTO format
export async function fetchMyCards(): Promise<CardDTO[]> {
  try {
    const bookings = await fetchMyBookings();
    
    return bookings.map(booking => ({
      id: booking.id,
      bookingId: booking.id,
      pickupTime: booking.pickup_time,
      pickupLocation: booking.pickup_location,
      dropoffLocation: booking.dropoff_location,
      vehicleType: booking.vehicle_type || '',
      status: booking.status || '',
      paymentStatus: booking.payment_status || 'pending',
      finalPrice: booking.final_price_cents ? booking.final_price_cents / 100 : null,
      passengerName: `${booking.passenger_first_name || ''} ${booking.passenger_last_name || ''}`.trim(),
      passengerPhoto: booking.passenger_photo_url,
      driverName: booking.driver_full_name,
      driverPhoto: booking.driver_photo_url,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }));
  } catch (error) {
    console.error('❌ Error in fetchMyCards:', error);
    throw error;
  }
}

// Fetch detailed booking information
export async function fetchBookingDetail(bookingId: string): Promise<DetailDTO | null> {
  try {
    console.log('🔍 Fetching booking detail for ID:', bookingId);
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        code,
        pickup_time,
        pickup_location,
        dropoff_location,
        vehicle_type,
        status,
        payment_status,
        final_price_cents,
        created_at,
        updated_at,
        passengers(
          id,
          full_name,
          email,
          phone,
          profile_photo_url
        ),
        drivers!driver_id(
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📭 No booking found with ID:', bookingId);
        return null;
      }
      console.error('❌ Error fetching booking detail:', error);
      throw error;
    }

    if (!booking) {
      return null;
    }

    const passengerNames = booking.passengers?.full_name?.split(' ') || ['', ''];
    
    return {
      id: booking.id,
      bookingCode: booking.code || '',
      pickupTime: booking.pickup_time,
      pickupLocation: booking.pickup_location,
      dropoffLocation: booking.dropoff_location,
      vehicleType: booking.vehicle_type || '',
      status: booking.status || '',
      paymentStatus: booking.payment_status || 'pending',
      finalPrice: booking.final_price_cents ? booking.final_price_cents / 100 : null,
      passenger: {
        id: booking.passengers?.id || '',
        firstName: passengerNames[0] || '',
        lastName: passengerNames.slice(1).join(' ') || '',
        email: booking.passengers?.email || '',
        phone: booking.passengers?.phone || '',
        photoUrl: booking.passengers?.profile_photo_url || null
      },
      driver: booking.drivers ? {
        id: booking.drivers.id,
        fullName: booking.drivers.full_name || '',
        email: booking.drivers.email || '',
        phone: booking.drivers.phone || '',
        photoUrl: booking.drivers.avatar_url || null
      } : null,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    };
  } catch (error) {
    console.error('❌ Error in fetchBookingDetail:', error);
    throw error;
  }
}