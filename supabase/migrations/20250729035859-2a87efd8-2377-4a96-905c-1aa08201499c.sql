-- Primeiro vamos ver as constraints atuais
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%bookings%payment_status%';

-- Remover a constraint existente que está impedindo o funcionamento
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- Adicionar a constraint correta que permite todos os status necessários
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status IN ('pending', 'pending_payment', 'paid', 'failed', 'refunded'));

-- Também vamos atualizar a edge function para incluir as notificações de price_proposed e payment_confirmed
-- e adicionar suporte aos novos status