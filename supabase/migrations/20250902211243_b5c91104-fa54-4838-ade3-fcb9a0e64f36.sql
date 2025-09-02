-- Fix the _notify_payment_confirmed function format issue
CREATE OR REPLACE FUNCTION public._notify_payment_confirmed(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  v_now   timestamptz := now();
  v_b     RECORD;
  v_p     RECORD;
  v_d     RECORD;
  v_total_cents integer;
  v_currency   text := 'USD';
  v_msg text;
  v_dollar_amount numeric;
BEGIN
  -- Busca booking + passageiro + motorista
  SELECT
    b.id,
    b.passenger_id,
    b.driver_id,
    b.pickup_location,
    b.dropoff_location,
    b.pickup_time,
    b.vehicle_type,
    COALESCE(b.final_price_cents, b.estimated_price_cents, 0) AS total_cents,
    COALESCE(b.payment_status,'') AS payment_status
  INTO v_b
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF v_b.id IS NULL THEN
    RETURN;
  END IF;

  -- Apenas quando está de fato "paid"
  IF lower(v_b.payment_status) <> 'paid' THEN
    RETURN;
  END IF;

  SELECT id, COALESCE(full_name,'') AS full_name,
         COALESCE(email,'') AS email, COALESCE(phone,'') AS phone
  INTO v_p
  FROM public.passengers
  WHERE id = v_b.passenger_id;

  IF v_b.driver_id IS NOT NULL THEN
    SELECT id, COALESCE(full_name,'') AS full_name,
           COALESCE(email,'') AS email, COALESCE(phone,'') AS phone
    INTO v_d
    FROM public.drivers
    WHERE id = v_b.driver_id;
  END IF;

  v_total_cents := v_b.total_cents;
  v_dollar_amount := (v_total_cents / 100.0)::numeric(10,2);

  -- 1a) Mensagem de sistema no chat - Fix format string
  v_msg := format(
    '✅ Payment confirmed — Total: $%s · %s · %s → %s · Pickup: %s',
    v_dollar_amount::text,
    COALESCE(v_b.vehicle_type,'Vehicle'),
    COALESCE(v_b.pickup_location,''),
    COALESCE(v_b.dropoff_location,''),
    CASE WHEN v_b.pickup_time IS NOT NULL
         THEN to_char(v_b.pickup_time,'YYYY-MM-DD HH24:MI') ELSE 'TBD' END
  );
  
  PERFORM public.ensure_vip_chat_thread(v_b.id);
  PERFORM public.post_system_chat_message(v_b.id, v_msg);

  -- 1b) Notificação para o PASSAGEIRO
  INSERT INTO public.notification_outbox
    (booking_id, type, recipient_passenger_id, recipient_driver_id, payload, created_at)
  VALUES
    (
      v_b.id,
      'booking_updated',             -- tipo já existente no seu enum
      v_b.passenger_id,              -- destinatário: passageiro
      v_b.driver_id,                 -- contexto (opcional) do driver
      jsonb_build_object(
        'booking_id', v_b.id,
        'new_status', 'paid',
        'currency', v_currency,
        'total_cents', v_total_cents,
        'driver', CASE WHEN v_b.driver_id IS NOT NULL THEN jsonb_build_object(
                    'id', v_d.id,
                    'name', v_d.full_name,
                    'email', v_d.email,
                    'phone', v_d.phone
                  ) ELSE NULL END,
        'pickup_location',  COALESCE(v_b.pickup_location,''),
        'dropoff_location', COALESCE(v_b.dropoff_location,''),
        'pickup_time',      v_b.pickup_time,
        'vehicle_type',     COALESCE(v_b.vehicle_type,'')
      ),
      v_now
    )
  ON CONFLICT DO NOTHING;

  -- 1c) Notificação para o MOTORISTA (se houver)
  IF v_b.driver_id IS NOT NULL THEN
    INSERT INTO public.notification_outbox
      (booking_id, type, recipient_passenger_id, recipient_driver_id, payload, created_at)
    VALUES
      (
        v_b.id,
        'booking_updated',
        v_b.passenger_id,          -- contexto do passageiro
        v_b.driver_id,             -- destinatário: driver
        jsonb_build_object(
          'booking_id', v_b.id,
          'new_status', 'paid',
          'currency', v_currency,
          'total_cents', v_total_cents,
          'passenger', jsonb_build_object(
            'id', v_p.id,
            'name', v_p.full_name,
            'email', v_p.email,
            'phone', v_p.phone
          ),
          'pickup_location',  COALESCE(v_b.pickup_location,''),
          'dropoff_location', COALESCE(v_b.dropoff_location,''),
          'pickup_time',      v_b.pickup_time,
          'vehicle_type',     COALESCE(v_b.vehicle_type,'')
        ),
        v_now
      )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;