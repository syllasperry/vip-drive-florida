-- Delete all booking-related data
DELETE FROM reviews;
DELETE FROM messages;
DELETE FROM message_status;
DELETE FROM bookings;

-- Clean up dummy/fake data from drivers table (keep structure but remove obvious fake data)
DELETE FROM drivers WHERE 
  email LIKE '%example.com' OR 
  email LIKE '%test.com' OR 
  email LIKE '%dummy%' OR
  email LIKE '%fake%' OR
  full_name ILIKE '%test%' OR
  full_name ILIKE '%dummy%' OR
  full_name ILIKE '%sample%' OR
  full_name ILIKE '%demo%';

-- Clean up dummy/fake data from passengers table
DELETE FROM passengers WHERE 
  email LIKE '%example.com' OR 
  email LIKE '%test.com' OR 
  email LIKE '%dummy%' OR
  email LIKE '%fake%' OR
  full_name ILIKE '%test%' OR
  full_name ILIKE '%dummy%' OR
  full_name ILIKE '%sample%' OR
  full_name ILIKE '%demo%';

-- Clean up any notification preferences for deleted users
DELETE FROM notification_preferences WHERE 
  user_id NOT IN (
    SELECT id FROM drivers 
    UNION 
    SELECT id FROM passengers
  );

-- Reset any auto-increment sequences if needed
-- This ensures clean IDs for new data