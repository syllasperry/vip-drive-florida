
export interface Booking {
  id: string;
  booking_code?: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location: string;
  vehicle_type?: string;
  status: string;
  payment_status?: string;
  price_cents?: number;
  currency?: string;
  passenger_count?: number;
  distance_miles?: number;
  created_at: string;
  updated_at?: string;
  passenger_id: string;
  driver_id?: string;
  
  // Passenger data
  passenger_first_name?: string;
  passenger_last_name?: string;
  passenger_name?: string;
  passenger_phone?: string;
  passenger_photo_url?: string;
  passenger_avatar_url?: string;
  passenger_email?: string;
  
  // Driver data
  driver_name?: string;
  driver_full_name?: string;
  driver_phone?: string;
  driver_photo_url?: string;
  driver_avatar_url?: string;
  driver_email?: string;
  
  // Additional metadata fields
  final_price?: number;
  final_price_cents?: number;
  estimated_price?: number;
  estimated_price_cents?: number;
  ride_status?: string;
  payment_confirmation_status?: string;
  status_passenger?: string;
  status_driver?: string;
  ride_stage?: string;
  payment_method?: string;
  driver_status?: string;
  passenger_status?: string;
  simple_status?: 'booking_requested' | 'payment_pending' | 'all_set' | 'completed' | 'cancelled';
  final_negotiated_price?: number;
  
  // Related data (for joins)
  passengers?: {
    id: string;
    full_name: string;
    phone?: string;
    profile_photo_url?: string;
    preferred_temperature?: number;
    music_preference?: string;
    interaction_preference?: string;
    trip_purpose?: string;
    additional_notes?: string;
    email?: string;
  };
  drivers?: {
    full_name: string;
    phone: string;
    profile_photo_url?: string;
    car_make: string;
    car_model: string;
    car_color: string;
    license_plate: string;
    email?: string;
  };
  driver_profiles?: {
    full_name: string;
    phone: string;
    profile_photo_url?: string;
    car_make: string;
    car_model: string;
    car_color: string;
    license_plate: string;
  };
}
