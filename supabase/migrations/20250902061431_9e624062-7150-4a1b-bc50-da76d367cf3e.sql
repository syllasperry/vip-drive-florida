-- Fix the booking status constraints and update the complete_payment_transaction RPC function

-- First, let's drop the conflicting constraints and create proper ones
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_allowed_chk;

-- Create a single, comprehensive status constraint
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'offer_sent'::text, 
  'payment_confirmed'::text, 
  'accepted'::text, 
  'declined'::text, 
  'in_progress'::text, 
  'completed'::text, 
  'cancelled'::text, 
  'needs_driver'::text, 
  'payment_pending'::text, 
  'all_set'::text
]));

-- Update the complete_payment_transaction function to use proper status values
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
  -- Update the booking with payment information using proper status values
  UPDATE public.bookings
  SET 
    payment_status = 'paid',
    status = 'payment_confirmed',  -- This is allowed by the constraint
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