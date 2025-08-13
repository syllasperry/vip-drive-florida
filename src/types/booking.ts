import { Database } from "@/integrations/supabase/types";

export type Booking = Database['public']['Tables']['bookings']['Row']
export type Driver = Database['public']['Tables']['driver_profiles']['Row']
export type Passenger = Database['public']['Tables']['passenger_profiles']['Row']

export type SimpleBookingStatus = 
  | "booking_requested" 
  | "payment_pending" 
  | "all_set" 
  | "completed" 
  | "cancelled";

export interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type: string;
  simple_status: SimpleBookingStatus;
  estimated_price?: number;
  final_negotiated_price?: number;
  final_price?: number;
  status: string;
  payment_status?: string;
  payment_confirmation_status?: string;
  driver_id?: string;
  passenger_id?: string;
  created_at?: string;
  updated_at?: string;
  drivers?: Driver | null;
  passengers?: Passenger | null;
  simple_status: SimpleBookingStatus;
  driver_profiles?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
  };
}
