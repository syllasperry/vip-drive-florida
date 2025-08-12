
import { supabase } from '@/integrations/supabase/client';

export interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type: string;
  simple_status: 'completed' | 'cancelled' | 'payment_pending' | 'all_set' | 'booking_requested';
  estimated_price: number;
  final_negotiated_price: number;
  final_price: number;
  driver_id?: string;
  passenger_id: string;
  payment_status: string;
  status: string;
  driver_profiles?: any;
}

export const mockBookings: Booking[] = [
  {
    id: "1",
    pickup_location: "Downtown Hotel",
    dropoff_location: "Airport Terminal",
    pickup_time: "2024-01-15T10:00:00Z",
    passenger_count: 2,
    vehicle_type: "Sedan",
    simple_status: "completed",
    estimated_price: 45,
    final_negotiated_price: 42,
    final_price: 42,
    driver_id: "driver-1",
    passenger_id: "passenger-1",
    payment_status: "paid",
    status: "completed"
  }
];

export const getBookings = async () => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return mockBookings;
    }

    return data || mockBookings;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return mockBookings;
  }
};
