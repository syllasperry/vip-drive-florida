-- Add new columns for preferred payment method and instructions
ALTER TABLE drivers 
ADD COLUMN preferred_payment_method TEXT,
ADD COLUMN payment_instructions TEXT;