-- Corrige o status do VIP-2025-044 para "paid"
UPDATE public.bookings 
SET status = 'paid'
WHERE id = '1decb4cb-168f-4698-b32c-08e38c7e33ee';

-- Adiciona registros de pagamento (sem ON CONFLICT)
INSERT INTO public.payments (booking_id, amount_cents, currency, method, status, meta)
SELECT '65a607e8-213f-4e40-9465-018a03b55834', 10000, 'USD', 'stripe', 'PAID', 
       '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z", "booking_code": "VIP-2025-043"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE booking_id = '65a607e8-213f-4e40-9465-018a03b55834');

INSERT INTO public.payments (booking_id, amount_cents, currency, method, status, meta)
SELECT '1decb4cb-168f-4698-b32c-08e38c7e33ee', 20000, 'USD', 'stripe', 'PAID', 
       '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z", "booking_code": "VIP-2025-044"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE booking_id = '1decb4cb-168f-4698-b32c-08e38c7e33ee');