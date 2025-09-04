-- Update the next_booking_code function to generate VIP-DXXXXXXXX format
CREATE OR REPLACE FUNCTION public.next_booking_code()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  code text;
  hex_part text;
BEGIN
  -- Generate 8 random hex characters
  hex_part := upper(substring(md5(random()::text || clock_timestamp()::text) for 8));
  
  -- Format: VIP-DXXXXXXXX
  code := 'VIP-D' || hex_part;
  RETURN code;
END
$function$;

-- Update existing bookings that don't have booking codes or have old format codes
UPDATE public.bookings 
SET code = public.next_booking_code(),
    booking_code = public.next_booking_code()
WHERE code IS NULL 
   OR booking_code IS NULL 
   OR NOT (code ~ '^VIP-D[0-9A-F]{8}$')
   OR NOT (booking_code ~ '^VIP-D[0-9A-F]{8}$');

-- Ensure both code and booking_code fields are consistent for all bookings
UPDATE public.bookings 
SET booking_code = code 
WHERE booking_code != code OR booking_code IS NULL;