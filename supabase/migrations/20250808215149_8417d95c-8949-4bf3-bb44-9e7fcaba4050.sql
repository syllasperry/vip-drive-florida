
-- Criar função para atualizar status quando preço final e motorista são definidos
CREATE OR REPLACE FUNCTION update_booking_offer_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se final_price e driver_id são definidos, atualizar para offer_sent
  IF NEW.final_price IS NOT NULL AND NEW.driver_id IS NOT NULL THEN
    NEW.status := 'offer_sent';
    NEW.ride_status := 'offer_sent';
    NEW.payment_confirmation_status := 'waiting_for_payment';
    NEW.updated_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função ao atualizar bookings
DROP TRIGGER IF EXISTS trg_update_booking_offer_status ON bookings;
CREATE TRIGGER trg_update_booking_offer_status
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_offer_status();

-- Criar índices para melhor performance nas consultas de status
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_status ON bookings(ride_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_confirmation_status);

-- Função para garantir consistência de dados existentes
UPDATE bookings 
SET 
  status = 'offer_sent',
  ride_status = 'offer_sent',
  payment_confirmation_status = 'waiting_for_payment',
  updated_at = now()
WHERE final_price IS NOT NULL 
  AND driver_id IS NOT NULL 
  AND status != 'offer_sent'
  AND status != 'completed'
  AND status != 'cancelled';
