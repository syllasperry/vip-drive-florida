-- Create RPC functions for notification preferences

-- Get notification preferences function
CREATE OR REPLACE FUNCTION app.get_notification_preferences()
RETURNS TABLE(
  email_notifications_enabled boolean,
  push_notifications_enabled boolean,
  sms_notifications_enabled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(np.email_enabled, true) as email_notifications_enabled,
    COALESCE(np.push_enabled, false) as push_notifications_enabled,
    COALESCE(np.promotions_enabled, false) as sms_notifications_enabled
  FROM public.notification_preferences np
  WHERE np.user_id = auth.uid()
  LIMIT 1;
  
  -- If no record found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, false, false;
  END IF;
END;
$$;

-- Set notification preferences function
CREATE OR REPLACE FUNCTION app.set_notification_preferences(
  p_email_enabled boolean DEFAULT NULL,
  p_push_enabled boolean DEFAULT NULL,
  p_sms_enabled boolean DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Upsert notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    user_type,
    email_enabled,
    push_enabled,
    promotions_enabled,
    updated_at
  ) VALUES (
    v_user_id,
    'passenger',
    COALESCE(p_email_enabled, true),
    COALESCE(p_push_enabled, false),
    COALESCE(p_sms_enabled, false),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_enabled = COALESCE(p_email_enabled, notification_preferences.email_enabled),
    push_enabled = COALESCE(p_push_enabled, notification_preferences.push_enabled),
    promotions_enabled = COALESCE(p_sms_enabled, notification_preferences.promotions_enabled),
    updated_at = now();

  -- Return updated preferences
  SELECT jsonb_build_object(
    'email_notifications_enabled', np.email_enabled,
    'push_notifications_enabled', np.push_enabled,
    'sms_notifications_enabled', np.promotions_enabled,
    'success', true
  ) INTO v_result
  FROM public.notification_preferences np
  WHERE np.user_id = v_user_id;

  RETURN v_result;
END;
$$;