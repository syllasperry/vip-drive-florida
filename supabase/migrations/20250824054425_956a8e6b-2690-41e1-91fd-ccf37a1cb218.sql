-- Fix Critical Tables Missing Row Level Security by adding appropriate RLS policies

-- 1. Add RLS policies for app_payments table
CREATE POLICY "Only dispatchers and admins can manage app_payments"
  ON public.app_payments
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

-- 2. Add RLS policies for booking_payments table
CREATE POLICY "Users can view payments for their bookings"
  ON public.booking_payments
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
  );

CREATE POLICY "Only dispatchers and admins can manage booking_payments"
  ON public.booking_payments
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

-- 3. Add RLS policies for payment_session_links table
CREATE POLICY "Users can view their own payment session links"
  ON public.payment_session_links
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid()
    )
  );

CREATE POLICY "Only system and dispatchers can manage payment session links"
  ON public.payment_session_links
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

-- 4. Add RLS policies for payment_sessions table  
CREATE POLICY "Users can view their own payment sessions"
  ON public.payment_sessions
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid()
    )
  );

CREATE POLICY "Only system and dispatchers can manage payment sessions"
  ON public.payment_sessions
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

-- 5. Add RLS policies for realtime_outbox table
CREATE POLICY "Users can only see their own realtime messages"
  ON public.realtime_outbox
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings 
      WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
  );

CREATE POLICY "Only system can insert realtime messages"
  ON public.realtime_outbox
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Add RLS policies for vehicle_categories table (read-only for most users)
CREATE POLICY "Anyone can view vehicle categories"
  ON public.vehicle_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage vehicle categories"
  ON public.vehicle_categories
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