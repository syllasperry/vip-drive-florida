-- Delete all ride-related data while preserving user accounts

-- Delete message status records first (references bookings)
DELETE FROM public.message_status;

-- Delete scheduled messages (references bookings)
DELETE FROM public.scheduled_messages;

-- Delete reviews (references bookings)
DELETE FROM public.reviews;

-- Delete messages (references bookings)
DELETE FROM public.messages;

-- Delete all booking records (main ride data)
DELETE FROM public.bookings;

-- Reset any sequences if needed (optional but good practice)
-- Note: UUIDs don't use sequences, so this is just for completeness