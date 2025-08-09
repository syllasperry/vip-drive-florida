
-- Remove the automatic driver assignment trigger that's causing legacy behavior
DROP TRIGGER IF EXISTS trigger_assign_matching_drivers ON public.bookings;

-- Update existing bookings that were auto-assigned to remove the assignment
-- so dispatcher can manually assign them
UPDATE public.bookings 
SET driver_id = NULL, 
    status = 'pending',
    ride_status = 'pending_driver',
    payment_confirmation_status = 'waiting_for_offer'
WHERE driver_id IS NOT NULL 
  AND status = 'pending'
  AND payment_confirmation_status = 'waiting_for_offer'
  AND final_price IS NULL;

-- Add a new trigger to ensure proper status synchronization when dispatcher assigns drivers
CREATE OR REPLACE FUNCTION sync_dispatcher_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when driver_id changes from NULL to a value (manual assignment)
  IF OLD.driver_id IS NULL AND NEW.driver_id IS NOT NULL THEN
    -- Set initial status for manual dispatcher assignment
    NEW.status = 'assigned';
    NEW.ride_status = 'assigned_by_dispatcher';
    NEW.payment_confirmation_status = 'waiting_for_offer';
    NEW.status_driver = 'assigned';
    NEW.status_passenger = 'driver_assigned';
  END IF;
  
  -- Sync status when offer is sent (final_price is set)
  IF NEW.final_price IS NOT NULL AND (OLD.final_price IS NULL OR OLD.final_price != NEW.final_price) THEN
    NEW.status = 'offer_sent';
    NEW.ride_status = 'offer_sent';
    NEW.payment_confirmation_status = 'price_awaiting_acceptance';
    NEW.status_driver = 'offer_sent';
    NEW.status_passenger = 'review_offer';
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new synchronization trigger
CREATE TRIGGER trigger_sync_dispatcher_assignment
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_dispatcher_assignment();

-- Ensure all status fields are properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_bookings_status_fields 
ON public.bookings (status, ride_status, payment_confirmation_status, driver_id, final_price);
