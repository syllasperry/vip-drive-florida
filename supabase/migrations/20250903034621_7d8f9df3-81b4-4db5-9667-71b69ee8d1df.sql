-- Remove todos os triggers da tabela bookings temporariamente
DO $$ 
DECLARE 
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN 
    SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.bookings'::regclass AND NOT tgisinternal
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.tgname || ' ON public.bookings';
  END LOOP;
END $$;

-- Agora faz as atualizações sem triggers
UPDATE public.bookings 
SET 
  payment_status = 'paid',
  payment_confirmation_status = 'all_set',
  paid_at = now(),
  updated_at = now()
WHERE id IN ('65a607e8-213f-4e40-9465-018a03b55834', '1decb4cb-168f-4698-b32c-08e38c7e33ee');