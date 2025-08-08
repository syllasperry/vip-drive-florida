
-- Create dispatcher table for exclusive access control
CREATE TABLE public.dispatchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the exclusive dispatcher
INSERT INTO public.dispatchers (email, full_name) VALUES 
('syllasperry@gmail.com', 'Sylla Perry');

-- Create enhanced drivers table for dispatcher management
CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  profile_photo_url TEXT,
  car_make TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year TEXT NOT NULL,
  car_color TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  bank_account_info JSONB DEFAULT '{}',
  entity_type TEXT CHECK (entity_type IN ('pessoa_fisica', 'pessoa_juridica')) DEFAULT 'pessoa_fisica',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create simplified booking statuses enum
CREATE TYPE public.simple_booking_status AS ENUM (
  'booking_requested',
  'payment_pending', 
  'all_set',
  'completed',
  'cancelled'
);

-- Update bookings table for new simplified workflow
ALTER TABLE public.bookings 
  ADD COLUMN simple_status simple_booking_status DEFAULT 'booking_requested',
  ADD COLUMN dispatcher_notes TEXT,
  ADD COLUMN final_negotiated_price DECIMAL(10,2),
  ADD COLUMN payment_method TEXT,
  ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 20.00,
  ADD COLUMN stripe_fee_rate DECIMAL(5,2) DEFAULT 2.90,
  ADD COLUMN dispatcher_id UUID REFERENCES public.dispatchers(id),
  ADD COLUMN assigned_driver_id UUID REFERENCES public.driver_profiles(id);

-- Create dispatcher-passenger messages table (no driver involvement)
CREATE TABLE public.dispatcher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) NOT NULL,
  dispatcher_id UUID REFERENCES public.dispatchers(id) NOT NULL,
  passenger_id UUID REFERENCES public.passengers(id) NOT NULL,
  sender_type TEXT CHECK (sender_type IN ('dispatcher', 'passenger')) NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment confirmations table
CREATE TABLE public.payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) NOT NULL,
  amount_total DECIMAL(10,2) NOT NULL,
  stripe_fee DECIMAL(10,2) NOT NULL,
  dispatcher_commission DECIMAL(10,2) NOT NULL,
  driver_payout DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  stripe_session_id TEXT,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create financial reports table
CREATE TABLE public.financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT CHECK (report_type IN ('dispatcher', 'driver')) NOT NULL,
  entity_id UUID NOT NULL, -- dispatcher_id or driver_id
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_earnings DECIMAL(10,2) NOT NULL,
  total_rides INTEGER NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.dispatchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatcher_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatcher access
CREATE POLICY "Only dispatchers can access dispatcher table" ON public.dispatchers
  FOR ALL USING (auth.email() = email);

CREATE POLICY "Dispatchers can manage driver profiles" ON public.driver_profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.dispatchers WHERE email = auth.email()));

CREATE POLICY "Dispatchers can access all messages" ON public.dispatcher_messages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.dispatchers WHERE email = auth.email()));

CREATE POLICY "Passengers can access their messages" ON public.dispatcher_messages
  FOR SELECT USING (passenger_id = auth.uid());

CREATE POLICY "Passengers can insert their messages" ON public.dispatcher_messages
  FOR INSERT WITH CHECK (passenger_id = auth.uid() AND sender_type = 'passenger');

CREATE POLICY "Dispatchers can access payment confirmations" ON public.payment_confirmations
  FOR ALL USING (EXISTS (SELECT 1 FROM public.dispatchers WHERE email = auth.email()));

CREATE POLICY "Dispatchers can access financial reports" ON public.financial_reports
  FOR ALL USING (EXISTS (SELECT 1 FROM public.dispatchers WHERE email = auth.email()));

-- Create function to check if user is dispatcher
CREATE OR REPLACE FUNCTION public.is_dispatcher(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dispatchers 
    WHERE email = user_email
  );
$$;

-- Update bookings RLS to include dispatcher access
CREATE POLICY "Dispatchers can access all bookings" ON public.bookings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.dispatchers WHERE email = auth.email()));
