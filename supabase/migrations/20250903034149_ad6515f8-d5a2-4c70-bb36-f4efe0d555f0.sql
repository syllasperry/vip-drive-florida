-- Correção manual direta dos bookings pagos
-- VIP-2025-043 (id: 65a607e8-213f-4e40-9465-018a03b55834)
UPDATE public.bookings 
SET 
  payment_status = 'paid',
  payment_confirmation_status = 'all_set',
  paid_at = COALESCE(paid_at, now()),
  updated_at = now()
WHERE id = '65a607e8-213f-4e40-9465-018a03b55834';

-- VIP-2025-044 (id: 1decb4cb-168f-4698-b32c-08e38c7e33ee) 
UPDATE public.bookings 
SET 
  status = 'paid',
  payment_status = 'paid', 
  payment_confirmation_status = 'all_set',
  paid_at = COALESCE(paid_at, now()),
  updated_at = now()
WHERE id = '1decb4cb-168f-4698-b32c-08e38c7e33ee';

-- Cria registros de pagamento para ambos
INSERT INTO public.payments (booking_id, amount_cents, currency, method, status, meta)
VALUES 
  ('65a607e8-213f-4e40-9465-018a03b55834', 10000, 'USD', 'stripe', 'PAID', 
   '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z", "reason": "stripe_payment_completed"}'::jsonb),
  ('1decb4cb-168f-4698-b32c-08e38c7e33ee', 20000, 'USD', 'stripe', 'PAID', 
   '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z", "reason": "stripe_payment_completed"}'::jsonb)
ON CONFLICT (booking_id) DO NOTHING;