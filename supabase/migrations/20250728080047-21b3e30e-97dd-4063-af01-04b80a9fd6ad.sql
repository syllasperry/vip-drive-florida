-- Adicionar colunas passenger_count e luggage_count à tabela bookings
ALTER TABLE public.bookings 
ADD COLUMN passenger_count INTEGER NOT NULL DEFAULT 1,
ADD COLUMN luggage_count INTEGER NOT NULL DEFAULT 0;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN public.bookings.passenger_count IS 'Número de passageiros para a viagem';
COMMENT ON COLUMN public.bookings.luggage_count IS 'Número de bagagens para a viagem';