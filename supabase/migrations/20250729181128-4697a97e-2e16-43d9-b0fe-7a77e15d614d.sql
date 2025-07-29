-- Add new columns to drivers table for payment methods and cancellation policy (if not exists)
DO $$
BEGIN
  -- Add columns to drivers table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'payment_methods_accepted') THEN
    ALTER TABLE public.drivers ADD COLUMN payment_methods_accepted TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'cancellation_policy') THEN
    ALTER TABLE public.drivers ADD COLUMN cancellation_policy TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'preferred_payment_method') THEN
    ALTER TABLE public.drivers ADD COLUMN preferred_payment_method TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'payment_instructions') THEN
    ALTER TABLE public.drivers ADD COLUMN payment_instructions TEXT;
  END IF;
  
  -- Add detailed payment method columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'payment_methods_credit_cards') THEN
    ALTER TABLE public.drivers ADD COLUMN payment_methods_credit_cards TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'payment_methods_digital') THEN
    ALTER TABLE public.drivers ADD COLUMN payment_methods_digital TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'zelle_info') THEN
    ALTER TABLE public.drivers ADD COLUMN zelle_info TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'venmo_info') THEN
    ALTER TABLE public.drivers ADD COLUMN venmo_info TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'apple_pay_info') THEN
    ALTER TABLE public.drivers ADD COLUMN apple_pay_info TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'google_pay_info') THEN
    ALTER TABLE public.drivers ADD COLUMN google_pay_info TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'payment_link_info') THEN
    ALTER TABLE public.drivers ADD COLUMN payment_link_info TEXT;
  END IF;
  
  -- Add columns to bookings table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'estimated_price') THEN
    ALTER TABLE public.bookings ADD COLUMN estimated_price DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'final_price') THEN
    ALTER TABLE public.bookings ADD COLUMN final_price DECIMAL(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'price_confirmed_at') THEN
    ALTER TABLE public.bookings ADD COLUMN price_confirmed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_expires_at') THEN
    ALTER TABLE public.bookings ADD COLUMN payment_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'payment_method') THEN
    ALTER TABLE public.bookings ADD COLUMN payment_method TEXT;
  END IF;
END $$;