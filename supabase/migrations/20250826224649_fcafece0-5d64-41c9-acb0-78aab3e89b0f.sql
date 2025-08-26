
-- Criar tabela para registrar eventos do webhook (se não existir)
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_event_id TEXT UNIQUE,
  event_type TEXT,
  booking_id UUID,
  amount_cents INTEGER,
  currency TEXT,
  payload JSONB NOT NULL,
  processed_ok BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy para apenas admins visualizarem eventos de webhook
CREATE POLICY "Only admins can read payment webhook events" 
ON public.payment_webhook_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);

-- Corrigir a função record_stripe_payment que está com parâmetros incorretos
CREATE OR REPLACE FUNCTION public.record_stripe_payment(
  _booking_code text,
  _amount_cents integer,
  _provider_reference text,
  _currency text DEFAULT 'usd'
)
RETURNS TABLE(updated boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking_id uuid;
  v_now timestamptz := now();
BEGIN
  -- Encontrar o booking pelo booking_code
  SELECT id INTO v_booking_id
  FROM public.bookings
  WHERE booking_code = _booking_code;

  IF v_booking_id IS NULL THEN
    RETURN QUERY SELECT false, 'Booking not found with code: ' || _booking_code;
    RETURN;
  END IF;

  -- Atualizar o booking para status pago
  UPDATE public.bookings
  SET 
    status = 'paid',
    payment_status = 'paid',
    paid_at = v_now,
    paid_amount_cents = _amount_cents,
    paid_currency = _currency,
    payment_provider = 'stripe',
    payment_reference = _provider_reference,
    updated_at = v_now
  WHERE id = v_booking_id;

  -- Registrar o pagamento na tabela payments
  INSERT INTO public.payments (
    booking_id,
    amount_cents,
    currency,
    method,
    provider_txn_id,
    status,
    meta
  ) VALUES (
    v_booking_id,
    _amount_cents,
    _currency,
    'stripe',
    _provider_reference,
    'PAID',
    jsonb_build_object(
      'provider', 'stripe',
      'booking_code', _booking_code,
      'processed_at', v_now
    )
  )
  ON CONFLICT (provider_txn_id) DO NOTHING; -- Evitar duplicatas

  RETURN QUERY SELECT true, 'Payment recorded successfully for booking: ' || _booking_code;
END;
$function$;

-- Garantir que existe coluna paid_currency na tabela bookings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'bookings' AND column_name = 'paid_currency') THEN
    ALTER TABLE public.bookings ADD COLUMN paid_currency TEXT DEFAULT 'USD';
  END IF;
END $$;
