-- Fix complete_payment_transaction to use correct enum value
CREATE OR REPLACE FUNCTION public.complete_payment_transaction(p_booking_id uuid, p_stripe_session_id text, p_payment_intent_id text, p_amount_cents integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_updated_rows integer;
BEGIN
  -- Update the booking with payment information using correct enum values
  UPDATE public.bookings
  SET 
    payment_status = 'paid',
    status = 'payment_confirmed',  -- Use 'payment_confirmed' which is valid in the enum
    paid_amount_cents = p_amount_cents,
    paid_at = now(),
    payment_provider = 'stripe',
    payment_reference = p_payment_intent_id,
    stripe_payment_intent_id = p_payment_intent_id,
    updated_at = now()
  WHERE id = p_booking_id;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  -- Return true if booking was updated successfully
  RETURN v_updated_rows > 0;
END;
$$;