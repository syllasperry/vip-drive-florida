export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          driver_id: string | null
          dropoff_location: string
          estimated_price: number | null
          final_price: number | null
          flight_info: string | null
          id: string
          luggage_count: number
          passenger_count: number
          passenger_id: string
          payment_expires_at: string | null
          payment_method: string | null
          payment_status: string
          pickup_location: string
          pickup_time: string
          price_confirmed_at: string | null
          status: string
          updated_at: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          dropoff_location: string
          estimated_price?: number | null
          final_price?: number | null
          flight_info?: string | null
          id?: string
          luggage_count?: number
          passenger_count?: number
          passenger_id: string
          payment_expires_at?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_location: string
          pickup_time: string
          price_confirmed_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          dropoff_location?: string
          estimated_price?: number | null
          final_price?: number | null
          flight_info?: string | null
          id?: string
          luggage_count?: number
          passenger_count?: number
          passenger_id?: string
          payment_expires_at?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_location?: string
          pickup_time?: string
          price_confirmed_at?: string | null
          status?: string
          updated_at?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      Bookings: {
        Row: {
          created_at: string
          driver_id: string
          dropoff_location: string
          flight_info: string
          id: string
          luggage_count: number
          passenger_count: number
          pickup_location: string
          pickup_time: string
          status: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          dropoff_location: string
          flight_info: string
          id?: string
          luggage_count: number
          passenger_count: number
          pickup_location: string
          pickup_time: string
          status: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          dropoff_location?: string
          flight_info?: string
          id?: string
          luggage_count?: number
          passenger_count?: number
          pickup_location?: string
          pickup_time?: string
          status?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          cancellation_policy: string | null
          car_color: string | null
          car_make: string | null
          car_model: string | null
          car_type: string | null
          car_year: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          license_plate: string | null
          payment_instructions: string | null
          payment_methods_accepted: string[] | null
          phone: string | null
          preferred_payment_method: string | null
          profile_photo_url: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          car_color?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          car_year?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          license_plate?: string | null
          payment_instructions?: string | null
          payment_methods_accepted?: string[] | null
          phone?: string | null
          preferred_payment_method?: string | null
          profile_photo_url?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          car_color?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          car_year?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          license_plate?: string | null
          payment_instructions?: string | null
          payment_methods_accepted?: string[] | null
          phone?: string | null
          preferred_payment_method?: string | null
          profile_photo_url?: string | null
        }
        Relationships: []
      }
      message_status: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message_text: string
          sender_id: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message_text: string
          sender_id: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message_text?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          additional_notes: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interaction_preference: string | null
          music_playlist_link: string | null
          music_preference: string | null
          phone: string | null
          preferred_temperature: number | null
          profile_photo_url: string | null
          trip_purpose: string | null
        }
        Insert: {
          additional_notes?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          interaction_preference?: string | null
          music_playlist_link?: string | null
          music_preference?: string | null
          phone?: string | null
          preferred_temperature?: number | null
          profile_photo_url?: string | null
          trip_purpose?: string | null
        }
        Update: {
          additional_notes?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interaction_preference?: string | null
          music_playlist_link?: string | null
          music_preference?: string | null
          phone?: string | null
          preferred_temperature?: number | null
          profile_photo_url?: string | null
          trip_purpose?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          passenger_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          passenger_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          passenger_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          photo_url: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
        }
        Relationships: []
      }
      vehicle_types: {
        Row: {
          code_name: string
          created_at: string | null
          id: string
          make: string
          model: string
          vehicle_name: string
        }
        Insert: {
          code_name: string
          created_at?: string | null
          id?: string
          make: string
          model: string
          vehicle_name: string
        }
        Update: {
          code_name?: string
          created_at?: string | null
          id?: string
          make?: string
          model?: string
          vehicle_name?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          available: boolean
          created_at: string
          description: string
          id: string
          image_url: string
          type: string
          user_id: string
        }
        Insert: {
          available?: boolean
          created_at: string
          description?: string
          id?: string
          image_url?: string
          type: string
          user_id: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_matching_drivers: {
        Args: { p_vehicle_make: string; p_vehicle_model: string }
        Returns: {
          driver_id: string
          driver_name: string
          driver_email: string
          driver_phone: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
