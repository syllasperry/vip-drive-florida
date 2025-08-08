
// Simple, explicit types for dashboard components
export interface SimplePassenger {
  full_name: string;
  phone: string;
  profile_photo_url: string | null;
}

export interface SimpleBooking {
  id: string;
  status: string;
  created_at: string;
  pickup_location: string;
  dropoff_location: string;
  final_price: number | null;
  estimated_price: number | null;
  date: string;
  time: string;
  passengers: SimplePassenger | null;
}

export interface SimpleUserProfile {
  full_name: string;
  profile_photo_url: string | null;
}

// Raw Supabase response type - kept minimal
export interface RawSupabaseBooking {
  id: string;
  status: string;
  created_at: string;
  pickup_location: string;
  dropoff_location: string;
  final_price: number | null;
  estimated_price: number | null;
  driver_id: string;
  passenger_id: string;
  passengers?: {
    full_name: string;
    phone: string;
    profile_photo_url: string | null;
  } | null;
}
