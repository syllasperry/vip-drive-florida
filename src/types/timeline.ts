
export interface StatusHistoryEntry {
  id: string; // Convert from number to string for consistency
  booking_id: string;
  status: string;
  created_at: string;
  updated_by?: string;
  role?: string;
  // Removed notes field as it doesn't exist in the database schema
  metadata: {
    message?: string;
    previous_status?: string;
    status_passenger?: string;
    status_driver?: string;
    ride_status?: string;
    payment_confirmation_status?: string;
    ride_stage?: string;
  };
}

export interface TimelineEvent {
  id: string;
  booking_id: string;
  status: string;
  created_at: string;
  updated_by: string | null;
  role: string | null;
  metadata: any;
}
