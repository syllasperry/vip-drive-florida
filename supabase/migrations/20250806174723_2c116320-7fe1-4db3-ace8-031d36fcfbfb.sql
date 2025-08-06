-- ==========================================
-- 🔒 Fix function search path security warnings
-- ==========================================

-- Fix assign_matching_drivers function
CREATE OR REPLACE FUNCTION public.assign_matching_drivers()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;

-- Fix create_booking_status_history function
CREATE OR REPLACE FUNCTION public.create_booking_status_history()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
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
$$;

-- Fix other existing functions with search path issues
CREATE OR REPLACE FUNCTION public.auto_publish_eligible_reviews()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Auto-publish if eligible (all 5-star ratings and good public review)
  IF NEW.auto_publish_eligible = true THEN
    NEW.is_published = true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_sync_to_all_set()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When both passenger confirms payment and driver accepts, set all_set
  IF NEW.status_passenger = 'payment_confirmed' AND NEW.status_driver = 'driver_accepted' THEN
    NEW.status_passenger = 'all_set';
    NEW.status_driver = 'all_set';
    NEW.ride_status = 'all_set';
    NEW.payment_confirmation_status = 'all_set';
  END IF;
  
  RETURN NEW;
END;
$$;