-- Fix the complete_payment_transaction RPC function to use correct status values and remove non-existent column references
DROP FUNCTION IF EXISTS public.complete_payment_transaction(uuid, text, text, integer);

CREATE OR REPLACE FUNCTION public.complete_payment_transaction(
  p_booking_id uuid,
  p_stripe_session_id text,
  p_payment_intent_id text,
  p_amount_cents integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_rows integer;
BEGIN
  -- Update the booking with payment information using correct status values
  UPDATE public.bookings
  SET 
    payment_status = 'paid',
    status = 'confirmed',  -- Use 'confirmed' instead of 'payment_confirmed'
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