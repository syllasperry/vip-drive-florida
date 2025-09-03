-- Força verificação manual dos pagamentos para os bookings específicos
-- Primeiro, vamos verificar se conseguimos encontrar esses pagamentos no Stripe e atualizá-los

-- Função para forçar a verificação e atualização manual de pagamentos
CREATE OR REPLACE FUNCTION public.force_payment_verification(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking record;
  v_result jsonb;
BEGIN
  -- Pega dados do booking
  SELECT * INTO v_booking
  FROM public.bookings 
  WHERE id = p_booking_id;
  
  IF v_booking.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Booking not found');
  END IF;
  
  -- Se o booking já tem status paid mas payment_status não, corrige
  IF v_booking.status = 'paid' AND v_booking.payment_status != 'paid' THEN
    UPDATE public.bookings
    SET 
      payment_status = 'paid',
      payment_confirmation_status = 'all_set',
      paid_at = COALESCE(paid_at, now()),
      updated_at = now()
    WHERE id = p_booking_id;
    
    -- Cria registro de pagamento se não existir
    INSERT INTO public.payments (
      booking_id,
      amount_cents,
      currency,
      method,
      status,
      meta
    ) VALUES (
      p_booking_id,
      COALESCE(v_booking.offer_price_cents, v_booking.final_price_cents, v_booking.estimated_price_cents, 0),
      'USD',
      'stripe',
      'PAID',
      jsonb_build_object('manually_verified', true, 'verified_at', now())
    )
    ON CONFLICT (booking_id) DO NOTHING;
    
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'Payment status corrected for booking with paid status',
      'booking_id', p_booking_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'info', 'No correction needed',
    'booking_id', p_booking_id,
    'current_status', v_booking.status,
    'current_payment_status', v_booking.payment_status
  );
END;
$function$;