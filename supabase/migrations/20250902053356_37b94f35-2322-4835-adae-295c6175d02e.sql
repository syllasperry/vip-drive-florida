-- Create the missing RPC function for payment completion
CREATE OR REPLACE FUNCTION public.complete_payment_transaction(
  p_booking_id uuid,
  p_stripe_session_id text,
  p_payment_intent_id text,
  p_amount_cents integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_rows integer;
BEGIN
  -- Update the booking with payment information
  UPDATE public.bookings
  SET 
    payment_status = 'paid',
    status = 'payment_confirmed',
    payment_confirmation_status = 'all_set',
    ride_status = 'all_set',
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
$function$;