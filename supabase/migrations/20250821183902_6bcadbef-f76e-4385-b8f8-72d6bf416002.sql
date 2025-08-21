-- Enable RLS on critical tables that are missing it

-- 1. Enable RLS on pricing_rules table (contains sensitive business data)
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for pricing_rules
CREATE POLICY "Only dispatchers can read pricing rules"
ON public.pricing_rules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
  )
);

CREATE POLICY "Only dispatchers can manage pricing rules"
ON public.pricing_rules
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
  )
);

-- 2. Enable RLS on system_settings table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);

CREATE POLICY "Only admins can manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);

-- 3. Enable RLS on email_outbox table
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only system and dispatchers can read email outbox"
ON public.email_outbox
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('dispatcher'::app_role, 'admin'::app_role)
  )
);

-- 4. Enable RLS on vip_chat_messages table
ALTER TABLE public.vip_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their booking chats"
ON public.vip_chat_messages
FOR SELECT
TO authenticated
USING (
  thread_id IN (
    SELECT vct.id 
    FROM public.vip_chat_threads vct
    JOIN public.bookings b ON b.id = vct.booking_id
    WHERE b.passenger_id = auth.uid() OR b.driver_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their booking chats"
ON public.vip_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  thread_id IN (
    SELECT vct.id 
    FROM public.vip_chat_threads vct
    JOIN public.bookings b ON b.id = vct.booking_id
    WHERE b.passenger_id = auth.uid() OR b.driver_id = auth.uid()
  )
  AND sender_id = auth.uid()
);

-- 5. Enable RLS on vip_chat_threads table  
ALTER TABLE public.vip_chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chat threads for their bookings"
ON public.vip_chat_threads
FOR SELECT
TO authenticated
USING (
  booking_id IN (
    SELECT b.id 
    FROM public.bookings b
    WHERE b.passenger_id = auth.uid() OR b.driver_id = auth.uid()
  )
);

-- 6. Enable RLS on payment_webhook_events table
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read payment webhook events"
ON public.payment_webhook_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'::app_role
  )
);

-- 7. Enable RLS on ride_status_history table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_status_history') THEN
    ALTER TABLE public.ride_status_history ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view ride status history for their bookings"
    ON public.ride_status_history
    FOR SELECT
    TO authenticated
    USING (
      booking_id IN (
        SELECT b.id 
        FROM public.bookings b
        WHERE b.passenger_id = auth.uid() OR b.driver_id = auth.uid()
      )
    );
  END IF;
END $$;