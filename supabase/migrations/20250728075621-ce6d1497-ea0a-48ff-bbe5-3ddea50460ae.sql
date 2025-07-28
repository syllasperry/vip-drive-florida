-- Adicionar coluna flight_info à tabela bookings
ALTER TABLE public.bookings 
ADD COLUMN flight_info TEXT DEFAULT '';

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.bookings.flight_info IS 'Informações de voo do passageiro (opcional)';