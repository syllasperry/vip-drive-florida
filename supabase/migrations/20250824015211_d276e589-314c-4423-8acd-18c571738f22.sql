
-- Primeiro, vamos verificar e corrigir as policies RLS das tabelas principais

-- 1. Habilitar RLS nas tabelas que estão sem proteção
ALTER TABLE public.booking_notification_prefs_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar policies básicas para booking_payments
CREATE POLICY "Users can view their booking payments" 
  ON public.booking_payments 
  FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
  );

CREATE POLICY "Users can create booking payments for their bookings" 
  ON public.booking_payments 
  FOR INSERT 
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
  );

-- 3. Corrigir policies para driver_offers
DROP POLICY IF EXISTS "Drivers see only their offers" ON public.driver_offers;
DROP POLICY IF EXISTS "Passengers see only their booking offers" ON public.driver_offers;

CREATE POLICY "Drivers can manage their offers" 
  ON public.driver_offers 
  FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Passengers can view offers for their bookings" 
  ON public.driver_offers 
  FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid()
    )
  );

-- 4. Corrigir policies para driver_vehicles
DROP POLICY IF EXISTS "dv_read_any" ON public.driver_vehicles;

CREATE POLICY "Drivers can manage their vehicles" 
  ON public.driver_vehicles 
  FOR ALL
  USING (driver_id = auth.uid())
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Users can view driver vehicles for shared bookings" 
  ON public.driver_vehicles 
  FOR SELECT 
  USING (
    driver_id IN (
      SELECT DISTINCT driver_id FROM public.bookings 
      WHERE passenger_id = auth.uid() AND driver_id IS NOT NULL
    )
  );

-- 5. Recrear views problemáticas com sintaxe correta

-- Recriar my_passenger_bookings view
DROP VIEW IF EXISTS public.my_passenger_bookings CASCADE;
CREATE VIEW public.my_passenger_bookings AS
SELECT 
  b.id as booking_id,
  b.booking_code,
  b.status,
  b.pickup_location,
  b.dropoff_location,
  b.pickup_time,
  b.created_at,
  b.updated_at,
  b.driver_id,
  b.distance_miles,
  b.vehicle_type,
  COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
  COALESCE(b.final_price_cents, b.estimated_price_cents) / 100.0 as price_dollars,
  COALESCE(b.offer_currency, 'USD') as currency,
  d.full_name as driver_name
FROM public.bookings b
LEFT JOIN public.drivers d ON d.id = b.driver_id
LEFT JOIN public.passengers p ON p.id = b.passenger_id
WHERE p.user_id = auth.uid();

-- Recriar passenger_dashboard_cards_v1 view
DROP VIEW IF EXISTS public.passenger_dashboard_cards_v1 CASCADE;
CREATE VIEW public.passenger_dashboard_cards_v1 AS
SELECT 
  b.id as booking_id,
  b.booking_code,
  b.status::booking_status,
  b.passenger_id,
  b.driver_id,
  b.pickup_time,
  b.pickup_location,
  b.dropoff_location,
  b.distance_miles,
  COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
  COALESCE(b.final_price_cents, b.estimated_price_cents) / 100.0 as price_dollars,
  b.created_at,
  b.updated_at,
  b.vehicle_type,
  COALESCE(b.offer_currency, 'USD') as currency,
  p.full_name as passenger_name,
  p.profile_photo_url as passenger_avatar_url,
  d.full_name as driver_name,
  d.profile_photo_url as driver_avatar_url
FROM public.bookings b
LEFT JOIN public.passengers p ON p.id = b.passenger_id
LEFT JOIN public.drivers d ON d.id = b.driver_id
WHERE p.user_id = auth.uid();

-- Recriar passenger_dashboard_cards_v2 view
DROP VIEW IF EXISTS public.passenger_dashboard_cards_v2 CASCADE;
CREATE VIEW public.passenger_dashboard_cards_v2 AS
SELECT 
  b.id as booking_id,
  b.booking_code,
  b.status::booking_status,
  b.distance_miles,
  COALESCE(b.final_price_cents, b.estimated_price_cents) as price_cents,
  COALESCE(b.final_price_cents, b.estimated_price_cents) / 100.0 as price_dollars,
  b.created_at,
  b.updated_at,
  b.vehicle_type,
  COALESCE(b.offer_currency, 'USD') as currency,
  p.full_name as passenger_name,
  p.profile_photo_url as passenger_avatar_url,
  d.full_name as driver_name,
  d.profile_photo_url as driver_avatar_url
FROM public.bookings b
LEFT JOIN public.passengers p ON p.id = b.passenger_id
LEFT JOIN public.drivers d ON d.id = b.driver_id
WHERE p.user_id = auth.uid();

-- 6. Criar função auxiliar para verificar se usuário é passageiro do booking
CREATE OR REPLACE FUNCTION public.user_is_passenger_of_booking(booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.passengers p ON p.id = b.passenger_id
    WHERE b.id = booking_id AND p.user_id = auth.uid()
  );
$$;

-- 7. Corrigir função _normalize_vehicle_category se não existir
CREATE OR REPLACE FUNCTION public._normalize_vehicle_category(vehicle_type text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF vehicle_type IS NULL THEN
    RETURN 'sedan';
  END IF;
  
  vehicle_type := LOWER(TRIM(vehicle_type));
  
  IF vehicle_type LIKE '%suv%' OR vehicle_type LIKE '%suburban%' THEN
    RETURN 'suv';
  ELSIF vehicle_type LIKE '%luxury%' OR vehicle_type LIKE '%premium%' THEN
    RETURN 'luxury';
  ELSIF vehicle_type LIKE '%van%' OR vehicle_type LIKE '%minivan%' THEN
    RETURN 'van';
  ELSE
    RETURN 'sedan';
  END IF;
END;
$$;

-- 8. Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON public.bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_passengers_user_id ON public.passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- 9. Garantir que a view v_system_settings existe
CREATE OR REPLACE VIEW public.v_system_settings AS
SELECT 
  COALESCE(
    (SELECT smart_price_enabled FROM public.system_settings LIMIT 1), 
    false
  ) as smart_price_enabled;
