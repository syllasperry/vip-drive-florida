-- Enable RLS on critical tables that are missing it (revised)

-- 1. Enable RLS on pricing_rules table (contains sensitive business data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_rules') THEN
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
  END IF;
END $$;

-- 2. Enable RLS on system_settings table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_settings') THEN
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
  END IF;
END $$;

-- 3. Enable RLS on email_outbox table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_outbox') THEN
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
  END IF;
END $$;

-- 4. Enable RLS on payment_webhook_events table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_webhook_events') THEN
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
  END IF;
END $$;

-- 5. Enable RLS on vip_chat tables if they exist
DO $$
BEGIN
  -- Check for vip_chat_threads first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vip_chat_threads') THEN
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
  END IF;

  -- Check for vip_chat_messages and handle based on existing columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vip_chat_messages') THEN
    ALTER TABLE public.vip_chat_messages ENABLE ROW LEVEL SECURITY;

    -- Create policies based on what columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vip_chat_messages' AND column_name = 'thread_id') THEN
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

      -- Only create insert policy if user_id column exists
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vip_chat_messages' AND column_name = 'user_id') THEN
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
          AND user_id = auth.uid()
        );
      END IF;
    END IF;
  END IF;
END $$;