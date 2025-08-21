
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/lib/types/booking';

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

export interface BookingHistoryEntry {
  status: string;
  metadata?: any;
  created_at: string;
  role?: string;
  changed_by?: string;
}

// Fetch passenger bookings using Supabase RPC
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
      id: row.booking_id || row.id,
      booking_code: row.booking_code || row.code || '',
      pickup_time: row.pickup_time,
      pickup_location: row.pickup_location,
      dropoff_location: row.dropoff_location,
      vehicle_type: row.vehicle_type,
      status: row.status,
      payment_status: row.payment_status,
      price_cents: row.price_cents || row.final_price_cents,
      currency: row.currency || 'USD',
      passenger_first_name: row.passenger_first_name || row.passenger_name?.split(' ')[0] || null,
      passenger_last_name: row.passenger_last_name || row.passenger_name?.split(' ').slice(1).join(' ') || null,
      passenger_name: row.passenger_name || `${row.passenger_first_name || ''} ${row.passenger_last_name || ''}`.trim(),
      passenger_photo_url: row.passenger_photo_url || row.passenger_avatar_url,
      passenger_id: row.passenger_id || '',
      driver_id: row.driver_id,
      driver_name: row.driver_name || row.driver_full_name,
      driver_full_name: row.driver_full_name || row.driver_name,
      driver_phone: row.driver_phone,
      driver_photo_url: row.driver_photo_url || row.driver_avatar_url,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
    
    // Sort by created_at DESC as requested
    return bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('❌ Error in fetchMyBookings:', error);
    return [];
  }
}

// Fetch booking history for a specific booking
export async function fetchBookingHistory(bookingId: string): Promise<BookingHistoryEntry[]> {
  try {
    console.log('📊 Fetching booking history for:', bookingId);
    
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('status, metadata, created_at, role, changed_by')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching booking history:', error);
      return [];
    }

    console.log('✅ Successfully fetched booking history:', data?.length || 0);
    
    return (data || []).map(entry => ({
      status: entry.status as string,
      metadata: entry.metadata || {},
      created_at: entry.created_at,
      role: entry.role,
      changed_by: entry.changed_by
    }));
  } catch (error) {
    console.error('❌ Error in fetchBookingHistory:', error);
    return [];
  }
}

// Subscribe to booking history changes
export function subscribeBookingHistory(bookingId: string, onChange: (history: BookingHistoryEntry[]) => void): () => void {
  console.log('🔔 Setting up booking history subscription for:', bookingId);
  
  const channel = supabase
    .channel(`booking-history-${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'booking_status_history',
        filter: `booking_id=eq.${bookingId}`
      },
      (payload) => {
        console.log('📡 Booking history update received:', payload);
        // Refetch history when any change occurs
        fetchBookingHistory(bookingId)
          .then(onChange)
          .catch(console.error);
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 Cleaning up booking history subscription');
    supabase.removeChannel(channel);
  };
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
      finalPrice: booking.price_cents ? booking.price_cents / 100 : null,
      passengerName: booking.passenger_name || '',
      passengerPhoto: booking.passenger_photo_url,
      driverName: booking.driver_name,
      driverPhoto: booking.driver_photo_url,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at || booking.created_at
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
