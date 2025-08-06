-- ==========================================
-- 📦 Fix driver_id assignment in bookings and add trigger for booking history
-- ==========================================

-- First, let's ensure booking_status_history table exists with proper structure
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'offered', 
        'accepted',
        'rejected',
        'expired',
        'all_set',
        'completed'
    )),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    notes TEXT,
    role TEXT CHECK (role IN ('driver', 'passenger')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id
    ON public.booking_status_history (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_status
    ON public.booking_status_history (status);

-- Enable realtime for booking_status_history
ALTER TABLE public.booking_status_history REPLICA IDENTITY FULL;

-- ==========================================
-- 🔧 Function to assign driver_id based on vehicle make/model matching
-- ==========================================
CREATE OR REPLACE FUNCTION public.assign_matching_drivers()
RETURNS TRIGGER AS $$
DECLARE
    driver_record RECORD;
    driver_count INTEGER := 0;
    vehicle_parts TEXT[];
BEGIN
    -- Only process if driver_id is NULL and vehicle_type is set
    IF NEW.driver_id IS NOT NULL OR NEW.vehicle_type IS NULL THEN
        RETURN NEW;
    END IF;

    -- Parse vehicle_type to extract make and model
    vehicle_parts := string_to_array(NEW.vehicle_type, ' ');
    
    IF array_length(vehicle_parts, 1) >= 2 THEN
        -- Find drivers with matching vehicle make (first part of vehicle_type)
        FOR driver_record IN 
            SELECT id, full_name, car_make, car_model
            FROM public.drivers 
            WHERE LOWER(TRIM(car_make)) = LOWER(TRIM(vehicle_parts[1]))
              AND car_make IS NOT NULL 
              AND car_make != ''
            LIMIT 5 -- Limit to 5 potential drivers
        LOOP
            driver_count := driver_count + 1;
            
            -- For the first matching driver, assign them to the booking
            IF driver_count = 1 THEN
                NEW.driver_id := driver_record.id;
                
                -- Log the assignment
                RAISE NOTICE 'Assigned driver % (%) to booking % for vehicle type %', 
                    driver_record.full_name, driver_record.id, NEW.id, NEW.vehicle_type;
            END IF;
        END LOOP;
        
        -- If no exact match found, try partial matching
        IF NEW.driver_id IS NULL THEN
            FOR driver_record IN 
                SELECT id, full_name, car_make, car_model
                FROM public.drivers 
                WHERE car_make IS NOT NULL 
                  AND car_make != ''
                  AND (
                    LOWER(car_make) LIKE LOWER('%' || vehicle_parts[1] || '%') OR
                    LOWER(NEW.vehicle_type) LIKE LOWER('%' || car_make || '%')
                  )
                LIMIT 1
            LOOP
                NEW.driver_id := driver_record.id;
                RAISE NOTICE 'Partial match: Assigned driver % to booking %', 
                    driver_record.full_name, NEW.id;
                EXIT; -- Take first match
            END LOOP;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 🔧 Function to automatically create booking status history entries
-- ==========================================
CREATE OR REPLACE FUNCTION public.create_booking_status_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if status actually changed
    IF TG_OP = 'UPDATE' AND (OLD.status = NEW.status) THEN
        RETURN NEW;
    END IF;

    -- Insert into booking status history
    INSERT INTO public.booking_status_history (
        booking_id,
        status,
        updated_by,
        role,
        metadata
    ) VALUES (
        NEW.id,
        NEW.status,
        COALESCE(NEW.driver_id, NEW.passenger_id), -- Use driver_id if available, otherwise passenger_id
        CASE 
            WHEN NEW.driver_id IS NOT NULL AND auth.uid() = NEW.driver_id THEN 'driver'
            WHEN auth.uid() = NEW.passenger_id THEN 'passenger'
            ELSE 'system'
        END,
        jsonb_build_object(
            'status_passenger', NEW.status_passenger,
            'status_driver', NEW.status_driver,
            'ride_status', NEW.ride_status,
            'payment_confirmation_status', NEW.payment_confirmation_status
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 🔧 Trigger to assign drivers on INSERT
-- ==========================================
DROP TRIGGER IF EXISTS trg_assign_drivers ON public.bookings;

CREATE TRIGGER trg_assign_drivers
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_matching_drivers();

-- ==========================================
-- 🔧 Trigger to create status history
-- ==========================================
DROP TRIGGER IF EXISTS trg_booking_status_history ON public.bookings;

CREATE TRIGGER trg_booking_status_history
    AFTER INSERT OR UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.create_booking_status_history();

-- ==========================================
-- 🔧 Fix existing bookings without driver_id
-- ==========================================
UPDATE public.bookings b
SET driver_id = d.id
FROM public.drivers d
WHERE b.driver_id IS NULL
  AND b.vehicle_type IS NOT NULL
  AND LOWER(TRIM(d.car_make)) = LOWER(TRIM(split_part(b.vehicle_type, ' ', 1)))
  AND d.car_make IS NOT NULL 
  AND d.car_make != '';

-- ==========================================
-- 🔧 Enable realtime for bookings table
-- ==========================================
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add bookings and booking_status_history to realtime publication
DO $$
BEGIN
    -- Check if publication exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    
    -- Add tables to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_status_history;
    
EXCEPTION WHEN duplicate_object THEN
    -- Tables already in publication, ignore error
    NULL;
END $$;