export interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type?: string;
  status: string;
  ride_status?: string;
  payment_confirmation_status?: string;
  status_passenger?: string;
  status_driver?: string;
  ride_stage?: string;
  payment_status?: string;
  payment_method?: string;
  driver_status?: string;
  passenger_status?: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  updated_at?: string;
  passenger_id: string;
  driver_id?: string;
  vehicle_id?: string;
  simple_status?: 'booking_requested' | 'payment_pending' | 'all_set' | 'completed' | 'cancelled';
  final_negotiated_price?: number;
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
  };
  drivers?: {
    full_name: string;
    phone: string;
    profile_photo_url?: string;
    car_make: string;
    car_model: string;
    car_color: string;
    license_plate: string;
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
