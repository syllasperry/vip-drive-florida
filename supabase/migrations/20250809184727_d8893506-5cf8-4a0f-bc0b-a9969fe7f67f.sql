
-- Remove obsolete database functions that are no longer needed
DROP FUNCTION IF EXISTS public.assign_matching_drivers() CASCADE;
DROP FUNCTION IF EXISTS public.sync_dispatcher_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.auto_sync_to_all_set() CASCADE;
DROP FUNCTION IF EXISTS public.sync_passenger_data() CASCADE;
DROP FUNCTION IF EXISTS public.sync_ride_status() CASCADE;
DROP FUNCTION IF EXISTS public.notify_ride_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.create_notification_for_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.fn_on_offer_insert() CASCADE;
DROP FUNCTION IF EXISTS public.track_status_changes() CASCADE;

-- Remove obsolete triggers
DROP TRIGGER IF EXISTS assign_matching_drivers_trigger ON public.bookings;
DROP TRIGGER IF EXISTS sync_dispatcher_assignment_trigger ON public.bookings;
DROP TRIGGER IF EXISTS auto_sync_to_all_set_trigger ON public.bookings;
DROP TRIGGER IF EXISTS sync_passenger_data_trigger ON public.bookings;
DROP TRIGGER IF EXISTS sync_ride_status_trigger ON public.bookings;
DROP TRIGGER IF EXISTS notify_ride_status_change_trigger ON public.bookings;
DROP TRIGGER IF EXISTS create_notification_for_status_change_trigger ON public.bookings;
DROP TRIGGER IF EXISTS track_status_changes_trigger ON public.bookings;

-- Clean up obsolete tables that are no longer used
DROP TABLE IF EXISTS public.ride_status_history CASCADE;
DROP TABLE IF EXISTS public.timeline_events CASCADE;
DROP TABLE IF EXISTS public.driver_offers CASCADE;
DROP TABLE IF EXISTS public.ride_status CASCADE;

-- Remove obsolete enum types
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Clean up obsolete columns from bookings table that are no longer needed
ALTER TABLE public.bookings 
DROP COLUMN IF EXISTS estimated_fare,
DROP COLUMN IF EXISTS distance_miles,
DROP COLUMN IF EXISTS driver_location_lat,
DROP COLUMN IF EXISTS driver_location_lng,
DROP COLUMN IF EXISTS ride_started_at,
DROP COLUMN IF EXISTS ride_completed_at,
DROP COLUMN IF EXISTS price_confirmed_at,
DROP COLUMN IF EXISTS passenger_payment_confirmed_at,
DROP COLUMN IF EXISTS driver_payment_confirmed_at,
DROP COLUMN IF EXISTS payment_expires_at,
DROP COLUMN IF EXISTS extra_stops,
DROP COLUMN IF EXISTS flight_info,
DROP COLUMN IF EXISTS luggage_size,
DROP COLUMN IF EXISTS luggage_count,
DROP COLUMN IF EXISTS passenger_preferences,
DROP COLUMN IF EXISTS passenger_first_name,
DROP COLUMN IF EXISTS passenger_last_name,
DROP COLUMN IF EXISTS passenger_phone,
DROP COLUMN IF EXISTS passenger_photo_url,
DROP COLUMN IF EXISTS driver_payment_instructions;

-- Clean up obsolete columns from drivers table
ALTER TABLE public.drivers
DROP COLUMN IF EXISTS self_registered,
DROP COLUMN IF EXISTS bank_info,
DROP COLUMN IF EXISTS payment_methods_credit_cards,
DROP COLUMN IF EXISTS payment_instructions,
DROP COLUMN IF EXISTS preferred_payment_method,
DROP COLUMN IF EXISTS cancellation_policy,
DROP COLUMN IF EXISTS payment_methods_accepted,
DROP COLUMN IF EXISTS business_type,
DROP COLUMN IF EXISTS account_name,
DROP COLUMN IF EXISTS account_type,
DROP COLUMN IF EXISTS payment_link_info,
DROP COLUMN IF EXISTS google_pay_info,
DROP COLUMN IF EXISTS apple_pay_info,
DROP COLUMN IF EXISTS venmo_info,
DROP COLUMN IF EXISTS zelle_info,
DROP COLUMN IF EXISTS payment_methods_digital,
DROP COLUMN IF EXISTS registration_link_token,
DROP COLUMN IF EXISTS registration_link_expires_at;

-- Remove obsolete notification_outbox table
DROP TABLE IF EXISTS public.notification_outbox CASCADE;

-- Update bookings table to keep only essential columns for current system
-- Ensure we keep: id, passenger_id, driver_id, pickup_location, dropoff_location, 
-- pickup_time, passenger_count, vehicle_type, vehicle_id, estimated_price, final_price,
-- status, ride_status, payment_confirmation_status, status_passenger, status_driver,
-- ride_stage, payment_status, payment_method, driver_status, passenger_status,
-- created_at, updated_at

-- Clean up RLS policies for removed tables
DROP POLICY IF EXISTS "Users see only their notifications" ON public.notification_outbox;
DROP POLICY IF EXISTS "Drivers see only their offers" ON public.driver_offers;
DROP POLICY IF EXISTS "Passengers see only their booking offers" ON public.driver_offers;
DROP POLICY IF EXISTS "Users see only their booking history" ON public.ride_status_history;

-- Ensure clean slate for current system
VACUUM FULL;
ANALYZE;
