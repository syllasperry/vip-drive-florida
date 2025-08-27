/*
  # Complete Payment Transaction Function

  1. Purpose
    - Atomically update booking payment status
    - Ensure data consistency across all payment-related fields
    - Prevent race conditions during payment processing

  2. Security
    - Function uses SECURITY DEFINER for elevated privileges
    - Validates booking exists before updating
    - Returns success/failure status for error handling
*/

CREATE OR REPLACE FUNCTION complete_payment_transaction(
  p_booking_id uuid,
  p_stripe_session_id text,
  p_payment_intent_id text,
  p_amount_cents integer
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_exists boolean;
  v_result json;
BEGIN
  -- Check if booking exists
  SELECT EXISTS(SELECT 1 FROM bookings WHERE id = p_booking_id) INTO v_booking_exists;
  
  IF NOT v_booking_exists THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  -- Atomic update of all payment-related fields
  UPDATE bookings SET
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

  -- Return success
  RETURN json_build_object(
    'success', true, 
    'booking_id', p_booking_id,
    'amount_cents', p_amount_cents,
    'updated_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return failure
    RAISE LOG 'Error in complete_payment_transaction: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;