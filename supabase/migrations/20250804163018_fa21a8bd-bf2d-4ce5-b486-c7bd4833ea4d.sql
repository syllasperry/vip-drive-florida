-- Enable realtime for bookings table to ensure status updates are pushed to passengers
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add the bookings table to realtime publication if not already added
DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;