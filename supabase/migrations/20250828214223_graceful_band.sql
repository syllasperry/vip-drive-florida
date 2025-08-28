/*
  # Payment Calculation Functions

  1. Functions
    - `calculate_total_paid` - Calculate total paid amount for a passenger
    - `calculate_awaiting_payments` - Calculate total awaiting payment amount for a passenger

  2. Security
    - Functions use SECURITY DEFINER to access data with elevated privileges
    - Input validation for passenger_id parameter
*/

-- Function to calculate total paid amount for a passenger
CREATE OR REPLACE FUNCTION calculate_total_paid(p_passenger_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_amount numeric := 0;
BEGIN
  -- Validate input
  IF p_passenger_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate total from paid bookings
  SELECT COALESCE(SUM(
    CASE 
      WHEN paid_amount_cents > 0 THEN paid_amount_cents / 100.0
      WHEN final_price > 0 THEN final_price
      WHEN estimated_price > 0 THEN estimated_price
      ELSE 0
    END
  ), 0)
  INTO total_amount
  FROM bookings
  WHERE passenger_id = p_passenger_id
    AND status = 'paid';

  RETURN total_amount;
END;
$$;

-- Function to calculate awaiting payments for a passenger
CREATE OR REPLACE FUNCTION calculate_awaiting_payments(p_passenger_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  awaiting_amount numeric := 0;
BEGIN
  -- Validate input
  IF p_passenger_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate total from offer_sent bookings
  SELECT COALESCE(SUM(
    CASE 
      WHEN offer_price_cents > 0 THEN offer_price_cents / 100.0
      WHEN final_price > 0 THEN final_price
      WHEN estimated_price > 0 THEN estimated_price
      ELSE 0
    END
  ), 0)
  INTO awaiting_amount
  FROM bookings
  WHERE passenger_id = p_passenger_id
    AND status = 'offer_sent';

  RETURN awaiting_amount;
END;
$$;