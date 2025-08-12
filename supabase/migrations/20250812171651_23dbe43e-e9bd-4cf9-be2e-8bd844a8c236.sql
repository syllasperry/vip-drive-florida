
-- Drop existing policies for ride_status_history table
DROP POLICY IF EXISTS "Users see only their booking history" ON public.ride_status_history;

-- Create comprehensive RLS policies for ride_status_history table
-- Allow users to view status history for their own bookings
CREATE POLICY "Users can view ride status history" 
  ON public.ride_status_history 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = ride_status_history.booking_id 
      AND (b.passenger_id = auth.uid() OR b.driver_id = auth.uid())
    )
  );

-- Allow users to insert status history for their own bookings
CREATE POLICY "Users can create ride status history" 
  ON public.ride_status_history 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = ride_status_history.booking_id 
      AND (b.passenger_id = auth.uid() OR b.driver_id = auth.uid())
    )
  );

-- Allow system/trigger to insert status history (for automated status tracking)
CREATE POLICY "System can create ride status history" 
  ON public.ride_status_history 
  FOR INSERT 
  WITH CHECK (true);

-- Allow updates to status history for authorized users
CREATE POLICY "Users can update ride status history" 
  ON public.ride_status_history 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = ride_status_history.booking_id 
      AND (b.passenger_id = auth.uid() OR b.driver_id = auth.uid())
    )
  );
