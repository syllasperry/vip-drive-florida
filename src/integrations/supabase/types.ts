export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      app_payments: {
        Row: {
          amount_cents: number | null
          booking_id: string
          created_at: string
          currency: string
          id: number
          method: string
          note: string | null
          status: string
        }
        Insert: {
          amount_cents?: number | null
          booking_id: string
          created_at?: string
          currency?: string
          id?: number
          method: string
          note?: string | null
          status: string
        }
        Update: {
          amount_cents?: number | null
          booking_id?: string
          created_at?: string
          currency?: string
          id?: number
          method?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "app_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          smartprice_enabled: boolean | null
          smartprice_markup_cents: number | null
          updated_at: string | null
        }
        Insert: {
          key: string
          smartprice_enabled?: boolean | null
          smartprice_markup_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          key?: string
          smartprice_enabled?: boolean | null
          smartprice_markup_cents?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_suggested_pricing: {
        Row: {
          booking_id: string
          currency: string
          inputs: Json | null
          miles_snapshot: number | null
          suggested_price_cents: number
          updated_at: string
          vehicle_category: string | null
        }
        Insert: {
          booking_id: string
          currency?: string
          inputs?: Json | null
          miles_snapshot?: number | null
          suggested_price_cents?: number
          updated_at?: string
          vehicle_category?: string | null
        }
        Update: {
          booking_id?: string
          currency?: string
          inputs?: Json | null
          miles_snapshot?: number | null
          suggested_price_cents?: number
          updated_at?: string
          vehicle_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_suggested_pricing_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "app_suggested_pricing_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_suggested_pricing_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      booking_code_counters: {
        Row: {
          last_value: number
          year: number
        }
        Insert: {
          last_value?: number
          year: number
        }
        Update: {
          last_value?: number
          year?: number
        }
        Relationships: []
      }
      booking_payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          method: string
          note: string | null
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          method: string
          note?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          method?: string
          note?: string | null
        }
        Relationships: []
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string | null
          id: number
          metadata: Json | null
          role: string | null
          status: Database["public"]["Enums"]["booking_sync_status"]
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
          status: Database["public"]["Enums"]["booking_sync_status"]
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
          status?: Database["public"]["Enums"]["booking_sync_status"]
          timestamp?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      bookings: {
        Row: {
          assigned_driver_id: string | null
          booking_code: string | null
          code: string | null
          created_at: string
          dispatcher_id: string | null
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
          estimated_price_cents: number | null
          extra_stops: Json | null
          final_price: number | null
          final_price_cents: number | null
          flight_info: string | null
          id: string
          luggage_count: number
          luggage_size: string | null
          offer_amount: number | null
          offer_amount_cents: number | null
          offer_currency: string | null
          offer_price_cents: number | null
          offer_sent_at: string | null
          offered_by_dispatcher_id: string | null
          paid_amount_cents: number | null
          paid_at: string | null
          paid_currency: string | null
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
          payment_provider: string | null
          payment_reference: string | null
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
          status_updated_at: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          vehicle_category: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
        Insert: {
          assigned_driver_id?: string | null
          booking_code?: string | null
          code?: string | null
          created_at?: string
          dispatcher_id?: string | null
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
          estimated_price_cents?: number | null
          extra_stops?: Json | null
          final_price?: number | null
          final_price_cents?: number | null
          flight_info?: string | null
          id?: string
          luggage_count?: number
          luggage_size?: string | null
          offer_amount?: number | null
          offer_amount_cents?: number | null
          offer_currency?: string | null
          offer_price_cents?: number | null
          offer_sent_at?: string | null
          offered_by_dispatcher_id?: string | null
          paid_amount_cents?: number | null
          paid_at?: string | null
          paid_currency?: string | null
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
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: string
          pickup_location: string
          pickup_time: string
          price_confirmed_at?: string | null
          ride_completed_at?: string | null
          ride_stage?: string | null
          ride_started_at?: string | null
          ride_status?: string | null
          status: string
          status_driver?: string | null
          status_passenger?: string | null
          status_updated_at?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          vehicle_category?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Update: {
          assigned_driver_id?: string | null
          booking_code?: string | null
          code?: string | null
          created_at?: string
          dispatcher_id?: string | null
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
          estimated_price_cents?: number | null
          extra_stops?: Json | null
          final_price?: number | null
          final_price_cents?: number | null
          flight_info?: string | null
          id?: string
          luggage_count?: number
          luggage_size?: string | null
          offer_amount?: number | null
          offer_amount_cents?: number | null
          offer_currency?: string | null
          offer_price_cents?: number | null
          offer_sent_at?: string | null
          offered_by_dispatcher_id?: string | null
          paid_amount_cents?: number | null
          paid_at?: string | null
          paid_currency?: string | null
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
          payment_provider?: string | null
          payment_reference?: string | null
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
          status_updated_at?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          vehicle_category?: string | null
          vehicle_id?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_offered_by_dispatcher_id_fkey"
            columns: ["offered_by_dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
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
          {
            foreignKeyName: "fk_bookings_assigned_driver"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_dispatcher"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatchers: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          profile_photo_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_photo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "driver_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
      driver_vehicles: {
        Row: {
          active: boolean
          created_at: string
          driver_id: string
          id: string
          vehicle_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          driver_id: string
          id?: string
          vehicle_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          driver_id?: string
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_vehicles_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          account_name: string | null
          account_type: string | null
          apple_pay_info: string | null
          avatar_url: string | null
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
          vehicle_category: string | null
          venmo_info: string | null
          zelle_info: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          apple_pay_info?: string | null
          avatar_url?: string | null
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
          vehicle_category?: string | null
          venmo_info?: string | null
          zelle_info?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          apple_pay_info?: string | null
          avatar_url?: string | null
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
          vehicle_category?: string | null
          venmo_info?: string | null
          zelle_info?: string | null
        }
        Relationships: []
      }
      dynamic_rate_buckets: {
        Row: {
          base_fee_cents: number
          id: number
          max_miles: number | null
          min_miles: number
          per_mile_cents: number
          vehicle_category: string | null
          vehicle_type: string
        }
        Insert: {
          base_fee_cents: number
          id?: number
          max_miles?: number | null
          min_miles: number
          per_mile_cents: number
          vehicle_category?: string | null
          vehicle_type: string
        }
        Update: {
          base_fee_cents?: number
          id?: number
          max_miles?: number | null
          min_miles?: number
          per_mile_cents?: number
          vehicle_category?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          last_error: string | null
          payload: Json
          recipient: string
          sent_at: string | null
          status: string
          template: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          last_error?: string | null
          payload: Json
          recipient: string
          sent_at?: string | null
          status?: string
          template: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          last_error?: string | null
          payload?: Json
          recipient?: string
          sent_at?: string | null
          status?: string
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "email_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
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
          event_type: string | null
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
          event_type?: string | null
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
          event_type?: string | null
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "notification_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_outbox_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
      passenger_preferences: {
        Row: {
          air_conditioning: boolean | null
          conversation_preference: string | null
          created_at: string
          id: string
          preferred_music: string | null
          preferred_temperature: number | null
          radio_on: boolean | null
          temperature_unit: string | null
          trip_notes: string | null
          trip_purpose: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          air_conditioning?: boolean | null
          conversation_preference?: string | null
          created_at?: string
          id?: string
          preferred_music?: string | null
          preferred_temperature?: number | null
          radio_on?: boolean | null
          temperature_unit?: string | null
          trip_notes?: string | null
          trip_purpose?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          air_conditioning?: boolean | null
          conversation_preference?: string | null
          created_at?: string
          id?: string
          preferred_music?: string | null
          preferred_temperature?: number | null
          radio_on?: boolean | null
          temperature_unit?: string | null
          trip_notes?: string | null
          trip_purpose?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          account_name: string | null
          account_type: string | null
          additional_notes: string | null
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string
          id: string
          interaction_preference: string | null
          last_name: string | null
          music_playlist_link: string | null
          music_preference: string | null
          phone: string | null
          preferred_temperature: number | null
          profile_photo_url: string | null
          trip_purpose: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          additional_notes?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name: string
          id?: string
          interaction_preference?: string | null
          last_name?: string | null
          music_playlist_link?: string | null
          music_preference?: string | null
          phone?: string | null
          preferred_temperature?: number | null
          profile_photo_url?: string | null
          trip_purpose?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          additional_notes?: string | null
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          interaction_preference?: string | null
          last_name?: string | null
          music_playlist_link?: string | null
          music_preference?: string | null
          phone?: string | null
          preferred_temperature?: number | null
          profile_photo_url?: string | null
          trip_purpose?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_session_links: {
        Row: {
          amount_cents_hint: number | null
          booking_id: string
          created_at: string
          currency_hint: string | null
          id: string
          provider: string
          provider_session_id: string
          status_hint: string | null
          updated_at: string
        }
        Insert: {
          amount_cents_hint?: number | null
          booking_id: string
          created_at?: string
          currency_hint?: string | null
          id?: string
          provider?: string
          provider_session_id: string
          status_hint?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents_hint?: number | null
          booking_id?: string
          created_at?: string
          currency_hint?: string | null
          id?: string
          provider?: string
          provider_session_id?: string
          status_hint?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_session_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payment_session_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_session_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      payment_sessions: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          stripe_session_id: string | null
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          stripe_session_id?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      payment_webhook_events: {
        Row: {
          amount_cents: number | null
          booking_id: string | null
          created_at: string
          currency: string | null
          event_type: string | null
          id: string
          payload: Json
          processed_ok: boolean
          provider: string
          provider_event_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string | null
          id?: string
          payload: Json
          processed_ok?: boolean
          provider: string
          provider_event_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          event_type?: string | null
          id?: string
          payload?: Json
          processed_ok?: boolean
          provider?: string
          provider_event_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string
          currency: string
          dispatcher_id: string | null
          id: string
          meta: Json | null
          method: string | null
          passenger_id: string | null
          provider_reference: string | null
          provider_txn_id: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string
          currency?: string
          dispatcher_id?: string | null
          id?: string
          meta?: Json | null
          method?: string | null
          passenger_id?: string | null
          provider_reference?: string | null
          provider_txn_id?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string
          currency?: string
          dispatcher_id?: string | null
          id?: string
          meta?: Json | null
          method?: string | null
          passenger_id?: string | null
          provider_reference?: string | null
          provider_txn_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "payments_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          base_fare_cents: number
          category_code: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          minimum_fare_cents: number
          per_mile_cents: number
          smart_addon_cents: number
          updated_at: string
        }
        Insert: {
          base_fare_cents: number
          category_code: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          minimum_fare_cents: number
          per_mile_cents: number
          smart_addon_cents?: number
          updated_at?: string
        }
        Update: {
          base_fare_cents?: number
          category_code?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          minimum_fare_cents?: number
          per_mile_cents?: number
          smart_addon_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_category_code_fkey"
            columns: ["category_code"]
            isOneToOne: false
            referencedRelation: "vehicle_categories"
            referencedColumns: ["code"]
          },
        ]
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
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          action_type: string
          attempts: number | null
          blocked_until: string | null
          created_at: string
          id: string
          identifier: string
          last_attempt_at: string
        }
        Insert: {
          action_type: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string
        }
        Update: {
          action_type?: string
          attempts?: number | null
          blocked_until?: string | null
          created_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string
        }
        Relationships: []
      }
      realtime_outbox: {
        Row: {
          booking_id: string
          created_at: string
          delivered_at: string | null
          id: number
          payload: Json
          topic: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          delivered_at?: string | null
          id?: number
          payload: Json
          topic: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: number
          payload?: Json
          topic?: string
        }
        Relationships: []
      }
      review_notifications: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          passenger_id: string
          review_submitted: boolean | null
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          passenger_id: string
          review_submitted?: boolean | null
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          passenger_id?: string
          review_submitted?: boolean | null
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "review_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "ride_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "ride_status_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_status_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "ride_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
      secure_payment_links: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          encrypted_url: string
          expires_at: string
          id: string
          used_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          encrypted_url: string
          expires_at: string
          id?: string
          used_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          encrypted_url?: string
          expires_at?: string
          id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secure_payment_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "secure_payment_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secure_payment_links_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          smart_price_enabled: boolean
          smart_price_markup_cents: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          smart_price_enabled?: boolean
          smart_price_markup_cents?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          smart_price_enabled?: boolean
          smart_price_markup_cents?: number | null
          updated_at?: string
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
            referencedRelation: "booking_notification_prefs_v1_secure"
            referencedColumns: ["booking_id"]
          },
          {
            foreignKeyName: "timeline_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "dispatcher_booking_cards_secure"
            referencedColumns: ["booking_id"]
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
      user_notification_prefs: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      vehicle_categories: {
        Row: {
          active: boolean
          code: string
          created_at: string
          display_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          display_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          display_name?: string
          updated_at?: string
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
      vip_chat_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_role: Database["public"]["Enums"]["vip_chat_sender_role"]
          thread_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_role?: Database["public"]["Enums"]["vip_chat_sender_role"]
          thread_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_role?: Database["public"]["Enums"]["vip_chat_sender_role"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "vip_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_chat_threads: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      booking_notification_prefs_v1_secure: {
        Row: {
          booking_id: string | null
          booking_status: string | null
          dispatcher_email_ok: boolean | null
          dispatcher_id: string | null
          dispatcher_push_ok: boolean | null
          dispatcher_user_id: string | null
          driver_email_ok: boolean | null
          driver_id: string | null
          driver_push_ok: boolean | null
          driver_user_id: string | null
          generated_at: string | null
          passenger_email_ok: boolean | null
          passenger_id: string | null
          passenger_push_ok: boolean | null
          passenger_user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_dispatcher_id_fkey"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_bookings_dispatcher"
            columns: ["dispatcher_id"]
            isOneToOne: false
            referencedRelation: "dispatchers"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatcher_booking_cards_secure: {
        Row: {
          booking_id: string | null
          created_at: string | null
          currency: string | null
          distance_miles: number | null
          driver_id: string | null
          driver_name: string | null
          driver_phone: string | null
          passenger_id: string | null
          passenger_name: string | null
          passenger_phone: string | null
          passenger_photo_url: string | null
          smartprice_enabled: boolean | null
          smartprice_markup_cents: number | null
          status: string | null
          suggested_price_cents: number | null
          updated_at: string | null
          vehicle_category: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_assigned_driver"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _normalize_vehicle_category: {
        Args: { p_vehicle_type: string }
        Returns: string
      }
      _notify_driver_assigned: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      _notify_payment_confirmed: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      api_booking_detail_json: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      api_dispatcher_mark_paid: {
        Args: {
          p_amount_cents?: number
          p_booking_id: string
          p_currency?: string
          p_payment_method?: string
        }
        Returns: Json
      }
      api_dispatcher_send_offer_v2: {
        Args: {
          p_booking_id: string
          p_currency?: string
          p_driver_id: string
          p_offer_cents?: number
        }
        Returns: Json
      }
      apply_payment_authoritative: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency?: string
          p_payload?: Json
          p_provider?: string
          p_provider_event_id?: string
        }
        Returns: undefined
      }
      apply_payment_by_session: {
        Args: {
          p_amount_cents: number
          p_currency?: string
          p_payload?: Json
          p_provider: string
          p_provider_session_id: string
        }
        Returns: undefined
      }
      apply_smartprice_if_enabled: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      assign_driver_after_payment: {
        Args: { p_booking_id: string; p_driver_id: string }
        Returns: undefined
      }
      assign_driver_and_send_offer: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_final_price: number
        }
        Returns: {
          assigned_driver_id: string
          booking_id: string
          booking_status: string
          final_price: number
        }[]
      }
      audit_view_access: {
        Args: { p_user_id?: string; p_view_name: string }
        Returns: boolean
      }
      booking_checkout_amount: {
        Args: { p_booking_id: string }
        Returns: {
          amount_cents: number
          currency: string
        }[]
      }
      booking_mark_paid_auto: {
        Args:
          | {
              amount_cents: number
              booking_id: string
              currency: string
              provider_payment_id?: string
              raw?: Json
              source?: string
            }
          | {
              p_amount_cents?: number
              p_booking_id: string
              p_currency?: string
              p_source?: string
            }
        Returns: undefined
      }
      booking_price_breakdown: {
        Args: { p_booking_id: string }
        Returns: {
          app_fee_cents: number
          base_cents: number
          booking_id: string
          currency: string
          dispatcher_fee_cents: number
          stripe_grossup_cents: number
          subtotal_cents: number
          total_cents: number
        }[]
      }
      can_act_on_booking_passenger: {
        Args: { pax_id: string }
        Returns: boolean
      }
      can_view_assigned_driver: {
        Args: { driver_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      can_view_driver_in_bookings: {
        Args: { driver_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      check_booking_access: {
        Args: { p_booking_id: string }
        Returns: {
          access_type: string
          has_access: boolean
          user_role: string
        }[]
      }
      complete_payment_transaction: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_payment_intent_id: string
          p_stripe_session_id: string
        }
        Returns: boolean
      }
      compute_suggested_for_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      compute_suggested_price: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      confirm_payment: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency?: string
          p_meta?: Json
          p_method?: string
          p_provider_txn_id?: string
        }
        Returns: undefined
      }
      confirm_payment_secure: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_method: string
          p_note?: string
          p_provider_reference?: string
        }
        Returns: Json
      }
      dispatcher_assign_driver: {
        Args:
          | {
              p_booking_id: string
              p_dispatcher_id: string
              p_driver_id: string
            }
          | { p_booking_id: string; p_driver_id: string }
        Returns: {
          booking_id: string
          driver_id: string
          driver_name: string
          driver_phone: string
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
        }[]
      }
      dispatcher_assign_driver_and_price: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_estimated_price: number
          p_final_price?: number
        }
        Returns: {
          booking_id: string
          driver_id: string
          estimated_price: number
          final_price: number
          status: string
          updated_at: string
        }[]
      }
      dispatcher_assign_offer: {
        Args: {
          p_booking_id: string
          p_currency?: string
          p_driver_id: string
          p_offer_amount: number
        }
        Returns: undefined
      }
      dispatcher_booking_passenger_details: {
        Args: { b_id: string }
        Returns: {
          conversation_preference: string
          email: string
          full_name: string
          passenger_id: string
          phone: string
          photo_url: string
          preferred_music: string
          preferred_temperature: number
          trip_notes: string
          trip_purpose: string
        }[]
      }
      dispatcher_cancel_offer: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: undefined
      }
      dispatcher_clear_assignment: {
        Args: { p_booking_id: string }
        Returns: {
          booking_id: string
          driver_id: string
          estimated_price: number
          final_price: number
          status: string
          updated_at: string
        }[]
      }
      dispatcher_confirm_payment: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency?: string
          p_txn_id?: string
        }
        Returns: undefined
      }
      dispatcher_get_booking_detail: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          passenger_first_name: string
          passenger_last_name: string
          passenger_name: string
          passenger_phone: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_get_booking_detail_v2: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          driver_phone: string
          dropoff_location: string
          estimated_price_cents: number
          final_price_cents: number
          has_driver: boolean
          passenger_avatar_url: string
          passenger_first_name: string
          passenger_id: string
          passenger_last_name: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          smartprice_enabled: boolean
          status: Database["public"]["Enums"]["booking_sync_status"]
          suggested_price_cents: number
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_get_booking_detail_v3: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_first_name: string
          passenger_id: string
          passenger_last_name: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          smartprice_enabled: boolean
          status: Database["public"]["Enums"]["booking_sync_status"]
          suggested_price_cents: number
          suggested_price_dollars: number
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_get_bookings_list_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_id: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_list_bookings: {
        Args:
          | Record<PropertyKey, never>
          | { p_limit?: number; p_offset?: number; p_search?: string }
          | {
              p_page?: number
              p_page_size?: number
              p_search?: string
              p_status?: string
            }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          driver_phone: string
          passenger_avatar_url: string
          passenger_id: string
          passenger_name: string
          passenger_phone: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_list_bookings_v2: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_first_name: string
          passenger_id: string
          passenger_last_name: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          total_rows: number
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_list_bookings_v3: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_id: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      dispatcher_mark_paid: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency?: string
          p_method: string
          p_tx_ref?: string
        }
        Returns: {
          amount_cents: number
          assigned_driver_id: string
          booking_id: string
          currency: string
          new_status: string
          paid_at: string
          passenger_id: string
          payment_method: string
        }[]
      }
      dispatcher_mark_paid_and_notify: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency?: string
          p_method: string
          p_note?: string
        }
        Returns: undefined
      }
      dispatcher_offer_and_assign: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_offer_price: number
        }
        Returns: undefined
      }
      dispatcher_reset_to_new_request: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: {
          accepted_at: string
          assigned_driver_id: string
          booking_id: string
          declined_at: string
          new_status: string
          offer_currency: string
          offer_price_cents: number
          offer_sent_at: string
        }[]
      }
      dispatcher_send_offer: {
        Args:
          | {
              p_booking_id: string
              p_currency: string
              p_dispatcher_id: string
              p_driver_id: string
              p_offer_price_cents: number
            }
          | {
              p_booking_id: string
              p_currency: string
              p_dispatcher_user_id: string
              p_offer_price_cents: number
            }
          | {
              p_booking_id: string
              p_currency?: string
              p_driver_id: string
              p_offer_amount: number
            }
          | { p_booking_id: string; p_offer_price: number }
        Returns: {
          booking_id: string
          final_price_cents: number
          new_status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
        }[]
      }
      dispatcher_send_offer_v3: {
        Args: {
          p_booking_id: string
          p_currency?: string
          p_dispatcher_user_id: string
          p_driver_id: string
          p_offer_price_cents: number
        }
        Returns: undefined
      }
      dispatcher_set_offer: {
        Args:
          | {
              p_amount_cents: number
              p_booking_id: string
              p_currency?: string
            }
          | {
              p_booking_id: string
              p_currency?: string
              p_driver_id: string
              p_offer_cents: number
            }
        Returns: {
          booking_id: string
          offer_currency: string
          offer_price_cents: number
          offer_sent_at: string
        }[]
      }
      drivers_for_booking: {
        Args: { bookingid: string }
        Returns: {
          email: string
          full_name: string
          id: string
          phone: string
          profile_photo_url: string
        }[]
      }
      enqueue_booking_paid_notifications: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      enqueue_payment_confirmation_emails: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      ensure_vip_chat_thread: {
        Args: { p_booking_id: string }
        Returns: string
      }
      estimate_fare: {
        Args: {
          p_apply_smart?: boolean
          p_category_code: string
          p_distance_miles: number
          p_duration_minutes?: number
        }
        Returns: Json
      }
      find_matching_drivers: {
        Args: { p_vehicle_make: string; p_vehicle_model: string }
        Returns: {
          driver_email: string
          driver_id: string
          driver_name: string
          driver_phone: string
        }[]
      }
      generate_driver_registration_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_app_settings: {
        Args: Record<PropertyKey, never>
        Returns: {
          key: string
          smartprice_enabled: boolean
          smartprice_markup_cents: number
          updated_at: string
        }[]
      }
      get_complete_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_dispatcher_booking_detail: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          passenger_avatar_url: string
          passenger_first_name: string
          passenger_id: string
          passenger_last_name: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_dispatcher_bookings: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          driver_phone: string
          passenger_avatar_url: string
          passenger_email: string
          passenger_first_name: string
          passenger_last_name: string
          passenger_phone: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_my_passenger_booking_detail: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_id: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_my_passenger_bookings: {
        Args:
          | Record<PropertyKey, never>
          | { p_limit?: number; p_offset?: number }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_id: string
          driver_name: string
          dropoff_location: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_my_passenger_bookings_v2: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          passenger_avatar_url: string
          passenger_name: string
          price_cents: number
          price_dollars: number
          status: string
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_my_passenger_bookings_v3: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_name: string
          passenger_avatar_url: string
          passenger_name: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_my_passenger_bookings_v4: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_id: string
          passenger_name: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_my_passenger_preferences: {
        Args: Record<PropertyKey, never>
        Returns: {
          air_conditioning: boolean
          conversation_preference: string
          preferred_music: string
          preferred_temperature: number
          radio_on: boolean
          temperature_unit: string
          trip_notes: string
          trip_purpose: string
        }[]
      }
      get_my_passenger_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_name: string | null
          account_type: string | null
          additional_notes: string | null
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string
          id: string
          interaction_preference: string | null
          last_name: string | null
          music_playlist_link: string | null
          music_preference: string | null
          phone: string | null
          preferred_temperature: number | null
          profile_photo_url: string | null
          trip_purpose: string | null
          updated_at: string | null
          user_id: string | null
        }
      }
      get_my_preferences: {
        Args: Record<PropertyKey, never>
        Returns: {
          air_conditioning: boolean | null
          conversation_preference: string | null
          created_at: string
          id: string
          preferred_music: string | null
          preferred_temperature: number | null
          radio_on: boolean | null
          temperature_unit: string | null
          trip_notes: string | null
          trip_purpose: string | null
          updated_at: string
          user_id: string
        }
      }
      get_or_create_passenger_profile: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_passenger_booking_detail: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          driver_phone: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_email: string
          passenger_id: string
          passenger_name: string
          passenger_phone: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_passenger_booking_detail_v1: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          passenger_avatar_url: string
          passenger_name: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: string
          updated_at: string
          vehicle_type: string
        }[]
      }
      get_passenger_bookings_by_auth: {
        Args: Record<PropertyKey, never>
        Returns: {
          booking_code: string
          created_at: string
          driver_avatar_url: string
          driver_id: string
          driver_name: string
          dropoff_location: string
          final_price_cents: number
          id: string
          payment_status: string
          pickup_location: string
          pickup_time: string
          status: string
          vehicle_type: string
        }[]
      }
      get_passenger_preferences_for_dispatcher: {
        Args: { p_booking_id: string }
        Returns: {
          air_conditioning: boolean
          conversation_preference: string
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          preferred_music: string
          preferred_temperature: number
          radio_on: boolean
          temperature_unit: string
          trip_notes: string
          trip_purpose: string
          user_id: string
        }[]
      }
      get_published_reviews: {
        Args: { limit_count?: number }
        Returns: {
          created_at: string
          id: string
          overall_rating: number
          passenger_name: string
          passenger_photo_url: string
          public_review: string
        }[]
      }
      get_ride_status_summary: {
        Args: { p_ride_id: string }
        Returns: {
          actor_role: string
          metadata: Json
          status_code: string
          status_label: string
          status_timestamp: string
        }[]
      }
      get_ride_timeline: {
        Args: { p_ride_id: string }
        Returns: {
          actor_role: string
          metadata: Json
          status_code: string
          status_label: string
          status_timestamp: string
        }[]
      }
      get_smartprice: {
        Args: Record<PropertyKey, never>
        Returns: {
          smartprice_enabled: boolean
          smartprice_markup_cents: number
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_dispatcher: {
        Args: Record<PropertyKey, never> | { p_email: string } | { u: string }
        Returns: boolean
      }
      is_dispatcher_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      is_passenger_of_booking: {
        Args: { p_booking: string; u: string }
        Returns: boolean
      }
      is_user_dispatcher: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      link_checkout_session: {
        Args: {
          p_amount_cents_hint?: number
          p_booking_id: string
          p_currency_hint?: string
          p_provider?: string
          p_provider_session_id: string
        }
        Returns: undefined
      }
      mark_booking_paid: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency: string
          p_stripe_session_id: string
        }
        Returns: {
          assigned_driver_id: string | null
          booking_code: string | null
          code: string | null
          created_at: string
          dispatcher_id: string | null
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
          estimated_price_cents: number | null
          extra_stops: Json | null
          final_price: number | null
          final_price_cents: number | null
          flight_info: string | null
          id: string
          luggage_count: number
          luggage_size: string | null
          offer_amount: number | null
          offer_amount_cents: number | null
          offer_currency: string | null
          offer_price_cents: number | null
          offer_sent_at: string | null
          offered_by_dispatcher_id: string | null
          paid_amount_cents: number | null
          paid_at: string | null
          paid_currency: string | null
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
          payment_provider: string | null
          payment_reference: string | null
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
          status_updated_at: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          vehicle_category: string | null
          vehicle_id: string | null
          vehicle_type: string | null
        }
      }
      mark_paid_manual: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency?: string
          p_method: string
          p_note?: string
        }
        Returns: undefined
      }
      mark_paid_on_stripe: {
        Args: {
          p_amount_cents: number
          p_booking_id: string
          p_currency: string
          p_method?: string
          p_payment_intent_id: string
          p_raw?: Json
        }
        Returns: undefined
      }
      mark_payment_failed: {
        Args: { p_booking_id: string; p_reason?: string }
        Returns: undefined
      }
      next_booking_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      notify_offer_sent: {
        Args: { p_booking_id: string; p_payment_url?: string }
        Returns: undefined
      }
      notify_payment_confirmed: {
        Args: { booking_id: string }
        Returns: undefined
      }
      passenger_accept_offer: {
        Args: { p_booking_id: string }
        Returns: {
          accepted_at: string
          assigned_driver_id: string
          booking_id: string
          new_status: string
          offer_currency: string
          offer_price_cents: number
          offer_sent_at: string
        }[]
      }
      passenger_create_booking: {
        Args: {
          p_distance_miles: number
          p_dropoff_location: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_pickup_location: string
          p_pickup_time: string
          p_vehicle_type: string
        }
        Returns: string
      }
      passenger_decline_offer: {
        Args: {
          p_booking_id: string
          p_reason?: string
          p_unassign_driver?: boolean
        }
        Returns: {
          assigned_driver_id: string
          booking_id: string
          declined_at: string
          new_status: string
        }[]
      }
      passenger_driver_profile: {
        Args: { _booking_id: string }
        Returns: {
          car_model: string
          driver_id: string
          email: string
          full_name: string
          phone: string
          photo_url: string
        }[]
      }
      passenger_get_booking_detail: {
        Args: { p_booking_id: string }
        Returns: {
          booking_code: string
          booking_id: string
          created_at: string
          currency: string
          distance_miles: number
          driver_id: string
          driver_name: string
          dropoff_location: string
          pickup_location: string
          pickup_time: string
          price_cents: number
          price_dollars: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          updated_at: string
          vehicle_type: string
        }[]
      }
      passenger_health_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      post_payment_confirmed_messages: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      post_system_chat_message: {
        Args: { p_body: string; p_booking_id: string }
        Returns: string
      }
      queue_payment_confirmation_emails: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      quote_booking: {
        Args: { p_apply_smart?: boolean; p_booking_id: string }
        Returns: Json
      }
      recompute_pricing_for_booking: {
        Args: { p_booking_id: string }
        Returns: {
          booking_id: string
          distance_miles: number
          estimated_currency: string
          estimated_price_cents: number
          smartprice_enabled: boolean
          smartprice_markup_cents: number
          suggested_currency: string
          suggested_price_cents: number
          updated_at: string
          vehicle_category: string
        }[]
      }
      recompute_suggested_price: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      record_stripe_payment: {
        Args: {
          _amount_cents: number
          _booking_code: string
          _currency?: string
          _provider_reference: string
        }
        Returns: {
          amount_cents: number
          booking_code: string
          booking_id: string
          new_status: string
          provider_reference: string
        }[]
      }
      resolve_booking_by_session: {
        Args: { p_provider: string; p_provider_session_id: string }
        Returns: string
      }
      resolve_vehicle_category: {
        Args: { p_vehicle_type: string }
        Returns: string
      }
      save_push_token: {
        Args: { p_platform?: string; p_token: string }
        Returns: undefined
      }
      set_category_smart_addon: {
        Args: { p_category_code: string; p_smart_addon_cents: number }
        Returns: undefined
      }
      set_smart_price_enabled: {
        Args: { p_enabled: boolean }
        Returns: Json
      }
      set_smartprice: {
        Args: { p_enabled: boolean; p_markup_cents: number }
        Returns: {
          smartprice_enabled: boolean
          smartprice_markup_cents: number
          updated_at: string
        }[]
      }
      set_smartprice_config: {
        Args: { p_enabled: boolean; p_markup_cents: number }
        Returns: undefined
      }
      suggest_price_for_booking: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      touch_and_recompute_booking: {
        Args: {
          p_booking_id: string
          p_distance_miles?: number
          p_vehicle_category?: string
        }
        Returns: {
          booking_id: string
          currency: string
          distance_miles: number
          driver_id: string
          final_price_cents: number
          smartprice_enabled: boolean
          smartprice_markup_cents: number
          status: Database["public"]["Enums"]["booking_sync_status"]
          suggested_price_cents: number
          updated_at: string
          vehicle_category: string
        }[]
      }
      upsert_current_passenger: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      upsert_my_passenger_preferences: {
        Args: {
          _air_conditioning: boolean
          _conversation_preference: string
          _preferred_music: string
          _preferred_temperature: number
          _radio_on: boolean
          _temperature_unit: string
          _trip_notes: string
          _trip_purpose: string
        }
        Returns: undefined
      }
      upsert_my_passenger_profile: {
        Args: {
          _email: string
          _first_name: string
          _last_name: string
          _phone: string
        }
        Returns: undefined
      }
      upsert_my_preferences: {
        Args: {
          _conversation: Database["public"]["Enums"]["conversation_pref"]
          _purpose: Database["public"]["Enums"]["trip_purpose"]
          _radio_enabled: boolean
          _temperature_f: number
        }
        Returns: {
          air_conditioning: boolean | null
          conversation_preference: string | null
          created_at: string
          id: string
          preferred_music: string | null
          preferred_temperature: number | null
          radio_on: boolean | null
          temperature_unit: string | null
          trip_notes: string | null
          trip_purpose: string | null
          updated_at: string
          user_id: string
        }
      }
      upsert_passenger_profile: {
        Args: { p_avatar_url?: string; p_full_name: string; p_phone: string }
        Returns: {
          account_name: string | null
          account_type: string | null
          additional_notes: string | null
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string
          id: string
          interaction_preference: string | null
          last_name: string | null
          music_playlist_link: string | null
          music_preference: string | null
          phone: string | null
          preferred_temperature: number | null
          profile_photo_url: string | null
          trip_purpose: string | null
          updated_at: string | null
          user_id: string | null
        }
      }
      user_is_dispatcher: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_is_driver_in_booking: {
        Args: { booking_driver_id: string }
        Returns: boolean
      }
      user_owns_booking: {
        Args: { booking_id: string }
        Returns: boolean
      }
      user_owns_driver_record: {
        Args: { driver_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      user_owns_passenger_in_booking: {
        Args: { booking_passenger_id: string }
        Returns: boolean
      }
      user_wants_email: {
        Args: { u: string }
        Returns: boolean
      }
      user_wants_push: {
        Args: { u: string }
        Returns: boolean
      }
      validate_dispatcher_access_simple: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: boolean
      }
      version_pricing_rule: {
        Args: {
          p_base_fare_cents: number
          p_category_code: string
          p_minimum_fare_cents: number
          p_per_mile_cents: number
          p_smart_addon_cents?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "dispatcher" | "driver" | "passenger"
      booking_status:
        | "pending"
        | "offer_sent"
        | "payment_confirmed"
        | "offer_accepted"
        | "offer_rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "payment_pending"
        | "price_awaiting_acceptance"
        | "all_set"
      booking_status_enum:
        | "NEW_REQUEST"
        | "OFFER_SENT"
        | "PAYMENT_PENDING"
        | "CONFIRMED"
        | "CANCELLED"
        | "COMPLETED"
        | "PAID"
        | "PAYMENT_FAILED"
        | "REFUNDED"
      booking_sync_status:
        | "pending"
        | "offer_sent"
        | "offer_accepted"
        | "offer_rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "booking_requested"
        | "payment_confirmed"
      conversation_pref: "no_preference" | "chatty" | "quiet"
      email_status: "pending" | "sent" | "failed"
      notification_type:
        | "offer_received"
        | "offer_accepted"
        | "offer_rejected"
        | "booking_updated"
        | "driver_arrived"
        | "ride_started"
        | "ride_completed"
        | "price_updated"
        | "booking_status_updated"
        | "payment_confirmed"
        | "ride_cancelled"
      trip_purpose: "leisure" | "business" | "other"
      vip_chat_sender_role: "system" | "dispatcher" | "passenger"
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
      app_role: ["admin", "dispatcher", "driver", "passenger"],
      booking_status: [
        "pending",
        "offer_sent",
        "payment_confirmed",
        "offer_accepted",
        "offer_rejected",
        "in_progress",
        "completed",
        "cancelled",
        "payment_pending",
        "price_awaiting_acceptance",
        "all_set",
      ],
      booking_status_enum: [
        "NEW_REQUEST",
        "OFFER_SENT",
        "PAYMENT_PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "PAID",
        "PAYMENT_FAILED",
        "REFUNDED",
      ],
      booking_sync_status: [
        "pending",
        "offer_sent",
        "offer_accepted",
        "offer_rejected",
        "in_progress",
        "completed",
        "cancelled",
        "booking_requested",
        "payment_confirmed",
      ],
      conversation_pref: ["no_preference", "chatty", "quiet"],
      email_status: ["pending", "sent", "failed"],
      notification_type: [
        "offer_received",
        "offer_accepted",
        "offer_rejected",
        "booking_updated",
        "driver_arrived",
        "ride_started",
        "ride_completed",
        "price_updated",
        "booking_status_updated",
        "payment_confirmed",
        "ride_cancelled",
      ],
      trip_purpose: ["leisure", "business", "other"],
      vip_chat_sender_role: ["system", "dispatcher", "passenger"],
    },
  },
} as const
