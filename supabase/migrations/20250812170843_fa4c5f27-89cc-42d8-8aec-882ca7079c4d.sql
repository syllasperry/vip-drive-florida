
-- First, let's check what values exist in the booking_status enum
SELECT unnest(enum_range(NULL::booking_status)) AS valid_values;

-- If payment_pending doesn't exist, let's add it to the enum
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_pending';

-- Also add other common status values that might be missing
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'offer_sent';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'price_awaiting_acceptance';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'all_set';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'cancelled';
