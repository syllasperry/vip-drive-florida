-- Adiciona registros de pagamento para os bookings corrigidos
INSERT INTO public.payments (booking_id, amount_cents, currency, method, status, meta)
VALUES 
  ('65a607e8-213f-4e40-9465-018a03b55834', 10000, 'USD', 'stripe', 'PAID', 
   '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z", "booking_code": "VIP-2025-043"}'::jsonb),
  ('1decb4cb-168f-4698-b32c-08e38c7e33ee', 20000, 'USD', 'stripe', 'PAID', 
   '{"manually_verified": true, "verified_at": "2025-09-03T03:40:00Z", "booking_code": "VIP-2025-044"}'::jsonb)
ON CONFLICT (booking_id) DO NOTHING;

-- Recria apenas os triggers essenciais (sem o problemático)
CREATE TRIGGER update_bookings_modtime 
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_booking_timestamp();

CREATE TRIGGER bookings_status_history 
  AFTER UPDATE ON public.bookings
  FOR EACH ROW 
  EXECUTE FUNCTION public.track_status_changes();