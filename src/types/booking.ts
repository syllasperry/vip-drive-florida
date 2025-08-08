
export interface Booking {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passenger_count: number;
  vehicle_type?: string;
  simple_status: 'booking_requested' | 'payment_pending' | 'all_set' | 'completed' | 'cancelled';
  estimated_price?: number;
  final_negotiated_price?: number;
  final_price?: number;
  created_at: string;
  passenger_id: string;
  driver_id?: string;
  status?: string;
  ride_status?: string;
  payment_confirmation_status?: string;
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
