-- Add missing columns to booking_status_history if they don't exist
ALTER TABLE booking_status_history
ADD COLUMN IF NOT EXISTS updated_by uuid;

-- Add timestamps for auditing
ALTER TABLE booking_status_history
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id
ON booking_status_history(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_updated_by
ON booking_status_history(updated_by);

-- Update old records that are missing updated_by
UPDATE booking_status_history
SET updated_by = b.passenger_id
FROM bookings b
WHERE booking_status_history.booking_id = b.id
  AND booking_status_history.updated_by IS NULL;