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
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string | null
          id: number
          metadata: Json | null
          role: string | null
          status: string
          timestamp: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
          role?: string | null
          status: string
          timestamp?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string | null
          id?: number
          metadata?: Json | null
          role?: string | null
          status?: string
          timestamp?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          distance_miles: number | null
          driver_id: string | null
          driver_location_lat: number | null
          driver_location_lng: number | null
          driver_payment_confirmed_at: string | null
          driver_payment_instructions: string | null
          driver_status: string | null
          dropoff_location: string
          estimated_fare: number | null
          estimated_price: number | null
          extra_stops: Json | null
          final_price: number | null
          flight_info: string | null
          id: string
          luggage_count: number
          luggage_size: string | null
          passenger_count: number
          passenger_first_name: string | null
          passenger_id: string
          passenger_last_name: string | null
          passenger_payment_confirmed_at: string | null
          passenger_phone: string | null
          passenger_photo_url: string | null
          passenger_preferences: Json | null
          passenger_status: string | null
          payment_confirmation_status: string | null
          payment_expires_at: string | null
          payment_method: string | null
          payment_status: string
          pickup_location: string
          pickup_time: string
          price_confirmed_at: string | null
          ride_completed_at: string | null
          ride_stage: string | null
          ride_started_at: string | null
          ride_status: string | null
          status: string
          status_driver: string | null
          status_passenger: string | null
          updated_at: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          distance_miles?: number | null
          driver_id?: string | null
          driver_location_lat?: number | null
          driver_location_lng?: number | null
          driver_payment_confirmed_at?: string | null
          driver_payment_instructions?: string | null
          driver_status?: string | null
          dropoff_location: string
          estimated_fare?: number | null
          estimated_price?: number | null
          extra_stops?: Json | null
          final_price?: number | null
          flight_info?: string | null
          id?: string
          luggage_count?: number
          luggage_size?: string | null
          passenger_count?: number
          passenger_first_name?: string | null
          passenger_id: string
          passenger_last_name?: string | null
          passenger_payment_confirmed_at?: string | null
          passenger_phone?: string | null
          passenger_photo_url?: string | null
          passenger_preferences?: Json | null
          passenger_status?: string | null
          payment_confirmation_status?: string | null
          payment_expires_at?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_location: string
          pickup_time: string
          price_confirmed_at?: string | null
          ride_completed_at?: string | null
          ride_stage?: string | null
          ride_started_at?: string | null
          ride_status?: string | null
          status?: string
          status_driver?: string | null
          status_passenger?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          distance_miles?: number | null
          driver_id?: string | null
          driver_location_lat?: number | null
          driver_location_lng?: number | null
          driver_payment_confirmed_at?: string | null
          driver_payment_instructions?: string | null
          driver_status?: string | null
          dropoff_location?: string
          estimated_fare?: number | null
          estimated_price?: number | null
          extra_stops?: Json | null
          final_price?: number | null
          flight_info?: string | null
          id?: string
          luggage_count?: number
          luggage_size?: string | null
          passenger_count?: number
          passenger_first_name?: string | null
          passenger_id?: string
          passenger_last_name?: string | null
          passenger_payment_confirmed_at?: string | null
          passenger_phone?: string | null
          passenger_photo_url?: string | null
          passenger_preferences?: Json | null
          passenger_status?: string | null
          payment_confirmation_status?: string | null
          payment_expires_at?: string | null
          payment_method?: string | null
          payment_status?: string
          pickup_location?: string
          pickup_time?: string
          price_confirmed_at?: string | null
          ride_completed_at?: string | null
          ride_stage?: string | null
          ride_started_at?: string | null
          ride_status?: string | null
          status?: string
          status_driver?: string | null
          status_passenger?: string | null
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
      driver_offers: {
        Row: {
          booking_id: string | null
          created_at: string | null
          driver_id: string | null
          estimated_arrival_time: unknown | null
          id: string
          offer_price: number | null
          price_cents: number | null
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          estimated_arrival_time?: unknown | null
          id?: string
          offer_price?: number | null
          price_cents?: number | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          driver_id?: string | null
          estimated_arrival_time?: unknown | null
          id?: string
          offer_price?: number | null
          price_cents?: number | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_offers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_registration_links: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          account_name: string | null
          account_type: string | null
          apple_pay_info: string | null
          bank_info: Json | null
          business_type: string | null
          cancellation_policy: string | null
          car_color: string | null
          car_make: string | null
          car_model: string | null
          car_type: string | null
          car_year: string | null
          created_at: string
          email: string
          full_name: string
          google_pay_info: string | null
          id: string
          license_plate: string | null
          payment_instructions: string | null
          payment_link_info: string | null
          payment_methods_accepted: string[] | null
          payment_methods_credit_cards: string[] | null
          payment_methods_digital: string[] | null
          phone: string | null
          preferred_payment_method: string | null
          profile_photo_url: string | null
          registration_link_expires_at: string | null
          registration_link_token: string | null
          self_registered: boolean | null
          status: string | null
          venmo_info: string | null
          zelle_info: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          apple_pay_info?: string | null
          bank_info?: Json | null
          business_type?: string | null
          cancellation_policy?: string | null
          car_color?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          car_year?: string | null
          created_at?: string
          email: string
          full_name: string
          google_pay_info?: string | null
          id?: string
          license_plate?: string | null
          payment_instructions?: string | null
          payment_link_info?: string | null
          payment_methods_accepted?: string[] | null
          payment_methods_credit_cards?: string[] | null
          payment_methods_digital?: string[] | null
          phone?: string | null
          preferred_payment_method?: string | null
          profile_photo_url?: string | null
          registration_link_expires_at?: string | null
          registration_link_token?: string | null
          self_registered?: boolean | null
          status?: string | null
          venmo_info?: string | null
          zelle_info?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          apple_pay_info?: string | null
          bank_info?: Json | null
          business_type?: string | null
          cancellation_policy?: string | null
          car_color?: string | null
          car_make?: string | null
          car_model?: string | null
          car_type?: string | null
          car_year?: string | null
          created_at?: string
          email?: string
          full_name?: string
          google_pay_info?: string | null
          id?: string
          license_plate?: string | null
          payment_instructions?: string | null
          payment_link_info?: string | null
          payment_methods_accepted?: string[] | null
          payment_methods_credit_cards?: string[] | null
          payment_methods_digital?: string[] | null
          phone?: string | null
          preferred_payment_method?: string | null
          profile_photo_url?: string | null
          registration_link_expires_at?: string | null
          registration_link_token?: string | null
          self_registered?: boolean | null
          status?: string | null
          venmo_info?: string | null
          zelle_info?: string | null
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
      notification_outbox: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          payload: Json | null
          recipient_driver_id: string | null
          recipient_id: string | null
          recipient_passenger_id: string | null
          sent_at: string | null
          status: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          recipient_driver_id?: string | null
          recipient_id?: string | null
          recipient_passenger_id?: string | null
          sent_at?: string | null
          status?: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          recipient_driver_id?: string | null
          recipient_id?: string | null
          recipient_passenger_id?: string | null
          sent_at?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_updates_enabled: boolean | null
          created_at: string | null
          driver_messages_enabled: boolean | null
          email_enabled: boolean | null
          id: string
          promotions_enabled: boolean | null
          push_enabled: boolean | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          booking_updates_enabled?: boolean | null
          created_at?: string | null
          driver_messages_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          promotions_enabled?: boolean | null
          push_enabled?: boolean | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          booking_updates_enabled?: boolean | null
          created_at?: string | null
          driver_messages_enabled?: boolean | null
          email_enabled?: boolean | null
          id?: string
          promotions_enabled?: boolean | null
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
          account_name: string | null
          account_type: string | null
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
          account_name?: string | null
          account_type?: string | null
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
          account_name?: string | null
          account_type?: string | null
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
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
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
      ride_reviews: {
        Row: {
          auto_publish_eligible: boolean | null
          booking_id: string
          comfort_rating: number
          communication_rating: number
          created_at: string
          driver_id: string
          driving_rating: number
          id: string
          is_published: boolean | null
          overall_rating: number | null
          passenger_id: string
          private_feedback: string | null
          public_review: string | null
          punctuality_rating: number
          updated_at: string
        }
        Insert: {
          auto_publish_eligible?: boolean | null
          booking_id: string
          comfort_rating: number
          communication_rating: number
          created_at?: string
          driver_id: string
          driving_rating: number
          id?: string
          is_published?: boolean | null
          overall_rating?: number | null
          passenger_id: string
          private_feedback?: string | null
          public_review?: string | null
          punctuality_rating: number
          updated_at?: string
        }
        Update: {
          auto_publish_eligible?: boolean | null
          booking_id?: string
          comfort_rating?: number
          communication_rating?: number
          created_at?: string
          driver_id?: string
          driving_rating?: number
          id?: string
          is_published?: boolean | null
          overall_rating?: number | null
          passenger_id?: string
          private_feedback?: string | null
          public_review?: string | null
          punctuality_rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_status: {
        Row: {
          actor_role: string
          created_at: string | null
          id: string
          metadata: Json | null
          ride_id: string
          status_code: string
          status_label: string
          status_timestamp: string | null
          updated_at: string | null
        }
        Insert: {
          actor_role: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          ride_id: string
          status_code: string
          status_label: string
          status_timestamp?: string | null
          updated_at?: string | null
        }
        Update: {
          actor_role?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          ride_id?: string
          status_code?: string
          status_label?: string
          status_timestamp?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_status_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_status_history: {
        Row: {
          booking_id: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["booking_status"]
          previous_status: Database["public"]["Enums"]["booking_status"] | null
        }
        Insert: {
          booking_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["booking_status"]
          previous_status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Update: {
          booking_id?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["booking_status"]
          previous_status?: Database["public"]["Enums"]["booking_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message_text: string
          send_at: string
          sent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message_text: string
          send_at: string
          sent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message_text?: string
          send_at?: string
          sent?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          booking_id: string
          created_at: string
          driver_id: string | null
          id: number
          passenger_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          system_message: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          driver_id?: string | null
          id?: number
          passenger_id?: string | null
          status: Database["public"]["Enums"]["booking_status"]
          system_message?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          driver_id?: string | null
          id?: number
          passenger_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          system_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_passenger_id_fkey"
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
      generate_driver_registration_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_complete_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_ride_status_summary: {
        Args: { p_ride_id: string }
        Returns: {
          actor_role: string
          status_code: string
          status_label: string
          status_timestamp: string
          metadata: Json
        }[]
      }
      get_ride_timeline: {
        Args: { p_ride_id: string }
        Returns: {
          status_code: string
          status_label: string
          actor_role: string
          status_timestamp: string
          metadata: Json
        }[]
      }
      user_owns_booking: {
        Args: { booking_id: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "offer_sent"
        | "offer_accepted"
        | "offer_rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
      notification_type:
        | "offer_received"
        | "offer_accepted"
        | "offer_rejected"
        | "booking_updated"
        | "driver_arrived"
        | "ride_started"
        | "ride_completed"
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
    Enums: {
      booking_status: [
        "pending",
        "offer_sent",
        "offer_accepted",
        "offer_rejected",
        "in_progress",
        "completed",
        "cancelled",
      ],
      notification_type: [
        "offer_received",
        "offer_accepted",
        "offer_rejected",
        "booking_updated",
        "driver_arrived",
        "ride_started",
        "ride_completed",
      ],
    },
  },
} as const
