-- ==========================================
-- 🔐 Enable RLS on tables
-- ==========================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Check if booking_status_history table exists, if not create it
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL
        CHECK (status IN (
            'pending',
            'offered', 
            'accepted',
            'rejected',
            'expired',
            'all_set'
        )),
    changed_by UUID,
    role TEXT CHECK (role IN ('driver', 'passenger')),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 👤 POLICY for PASSENGERS to view only their bookings
-- ==========================================
DROP POLICY IF EXISTS passenger_can_view_own_bookings ON public.bookings;

CREATE POLICY passenger_can_view_own_bookings
ON public.bookings
FOR SELECT
USING (auth.uid() = passenger_id);

-- ==========================================
-- 👤 POLICY for DRIVERS to view only their bookings
-- ==========================================
DROP POLICY IF EXISTS driver_can_view_own_bookings ON public.bookings;

CREATE POLICY driver_can_view_own_bookings
ON public.bookings
FOR SELECT
USING (auth.uid() = driver_id);

-- ==========================================
-- 🔒 Security definer function to check booking ownership
-- ==========================================
CREATE OR REPLACE FUNCTION public.user_owns_booking(booking_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.bookings 
        WHERE id = booking_id 
        AND (passenger_id = auth.uid() OR driver_id = auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- 📝 POLICY for PASSENGERS to view history of their bookings
-- ==========================================
DROP POLICY IF EXISTS passenger_can_view_own_history ON public.booking_status_history;

CREATE POLICY passenger_can_view_own_history
ON public.booking_status_history
FOR SELECT
USING (public.user_owns_booking(booking_id));

-- ==========================================
-- 📝 POLICY for DRIVERS to view history of their bookings  
-- ==========================================
DROP POLICY IF EXISTS driver_can_view_own_history ON public.booking_status_history;

CREATE POLICY driver_can_view_own_history
ON public.booking_status_history
FOR SELECT
USING (public.user_owns_booking(booking_id));

-- ==========================================
-- ✏️ Allow DRIVER to update status of their bookings
-- ==========================================
DROP POLICY IF EXISTS driver_can_update_status ON public.bookings;

CREATE POLICY driver_can_update_status
ON public.bookings
FOR UPDATE
USING (auth.uid() = driver_id);

-- ==========================================
-- ✏️ Allow PASSENGER to update status of their bookings
-- ==========================================
DROP POLICY IF EXISTS passenger_can_update_status ON public.bookings;

CREATE POLICY passenger_can_update_status
ON public.bookings
FOR UPDATE
USING (auth.uid() = passenger_id);

-- ==========================================
-- ✏️ Allow INSERT for passengers to create bookings
-- ==========================================
DROP POLICY IF EXISTS passenger_can_create_booking ON public.bookings;

CREATE POLICY passenger_can_create_booking
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = passenger_id);

-- ==========================================
-- ✏️ Allow INSERT/UPDATE for booking status history
-- ==========================================
DROP POLICY IF EXISTS users_can_create_status_history ON public.booking_status_history;

CREATE POLICY users_can_create_status_history
ON public.booking_status_history
FOR INSERT
WITH CHECK (public.user_owns_booking(booking_id));

DROP POLICY IF EXISTS users_can_update_status_history ON public.booking_status_history;

CREATE POLICY users_can_update_status_history
ON public.booking_status_history
FOR UPDATE
USING (public.user_owns_booking(booking_id));

-- ==========================================
-- 🔍 Create index for better performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking
    ON public.booking_status_history (booking_id);

CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id 
    ON public.bookings (passenger_id);

CREATE INDEX IF NOT EXISTS idx_bookings_driver_id 
    ON public.bookings (driver_id);