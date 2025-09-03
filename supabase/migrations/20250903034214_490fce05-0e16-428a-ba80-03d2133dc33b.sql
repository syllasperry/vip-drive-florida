-- Correção manual focada apenas nos campos de pagamento
-- Temporariamente desabilita o trigger problemático
ALTER TABLE public.bookings DISABLE TRIGGER payment_confirmation_sync;

-- Atualiza os bookings
UPDATE public.bookings 
SET 
  payment_status = 'paid',
  payment_confirmation_status = 'all_set',
  paid_at = now(),
  updated_at = now()
WHERE id IN ('65a607e8-213f-4e40-9465-018a03b55834', '1decb4cb-168f-4698-b32c-08e38c7e33ee');

-- Reabilita o trigger
ALTER TABLE public.bookings ENABLE TRIGGER payment_confirmation_sync;

-- Cria registros de pagamento
INSERT INTO public.payments (booking_id, amount_cents, currency, method, status, meta)
VALUES 
  ('65a607e8-213f-4e40-9465-018a03b55834', 10000, 'USD', 'stripe', 'PAID', 
   '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z"}'::jsonb),
  ('1decb4cb-168f-4698-b32c-08e38c7e33ee', 20000, 'USD', 'stripe', 'PAID', 
   '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z"}'::jsonb)
ON CONFLICT (booking_id) DO NOTHING;