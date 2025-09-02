-- Fix enqueue_payment_confirmation_emails function to remove non-existent column references
CREATE OR REPLACE FUNCTION public.enqueue_payment_confirmation_emails(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_b record;
  v_now timestamptz := now();
BEGIN
  -- Coleta dados do booking + passageiro + motorista
  SELECT
    b.id                          AS booking_id,
    b.booking_code,
    b.status,
    b.pickup_location,
    b.dropoff_location,
    b.pickup_time,
    b.final_price_cents,
    COALESCE(b.final_price_cents, 0) / 100.0::numeric(10,2) AS final_price_dollars,
    b.payment_method,
    b.passenger_id,
    b.driver_id,
    -- passageiro (only use existing columns)
    p.email                                     AS passenger_email,
    p.full_name                                 AS passenger_name,
    p.profile_photo_url                         AS passenger_avatar_url,
    p.phone                                     AS passenger_phone,
    -- motorista
    d.email                                     AS driver_email,
    d.full_name                                 AS driver_name,
    d.avatar_url                                AS driver_avatar_url,
    d.phone                                     AS driver_phone
  INTO v_b
  FROM public.bookings b
  LEFT JOIN public.passengers p ON p.id = b.passenger_id
  LEFT JOIN public.drivers    d ON d.id = b.driver_id
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking % not found for email enqueue', p_booking_id;
  END IF;

  -- Enfileira e-mail para PASSAGEIRO (confirmação + dados do motorista)
  IF v_b.passenger_email IS NOT NULL THEN
    INSERT INTO public.email_outbox (booking_id, recipient, template, payload, created_at)
    VALUES (
      v_b.booking_id,
      v_b.passenger_email,
      'payment_passenger',
      jsonb_build_object(
        'bookingId',       v_b.booking_id,
        'bookingCode',     v_b.booking_code,
        'status',          v_b.status,
        'priceDollars',    v_b.final_price_dollars,
        'paymentMethod',   v_b.payment_method,
        'pickup',          v_b.pickup_location,
        'dropoff',         v_b.dropoff_location,
        'pickupTime',      v_b.pickup_time,
        'passenger', jsonb_build_object(
          'name',        v_b.passenger_name,
          'email',       v_b.passenger_email,
          'phone',       v_b.passenger_phone,
          'avatarUrl',   v_b.passenger_avatar_url
        ),
        'driver', jsonb_build_object(
          'name',        v_b.driver_name,
          'email',       v_b.driver_email,
          'phone',       v_b.driver_phone,
          'avatarUrl',   v_b.driver_avatar_url
        )
      ),
      v_now
    );
  END IF;

  -- Enfileira e-mail para MOTORISTA (confirmação + dados do passageiro)
  IF v_b.driver_email IS NOT NULL THEN
    INSERT INTO public.email_outbox (booking_id, recipient, template, payload, created_at)
    VALUES (
      v_b.booking_id,
      v_b.driver_email,
      'payment_driver',
      jsonb_build_object(
        'bookingId',       v_b.booking_id,
        'bookingCode',     v_b.booking_code,
        'status',          v_b.status,
        'priceDollars',    v_b.final_price_dollars,
        'paymentMethod',   v_b.payment_method,
        'pickup',          v_b.pickup_location,
        'dropoff',         v_b.dropoff_location,
        'pickupTime',      v_b.pickup_time,
        'passenger', jsonb_build_object(
          'name',        v_b.passenger_name,
          'email',       v_b.passenger_email,
          'phone',       v_b.passenger_phone,
          'avatarUrl',   v_b.passenger_avatar_url
        ),
        'driver', jsonb_build_object(
          'name',        v_b.driver_name,
          'email',       v_b.driver_email,
          'phone',       v_b.driver_phone,
          'avatarUrl',   v_b.driver_avatar_url
        )
      ),
      v_now
    );
  END IF;
END;
$$;