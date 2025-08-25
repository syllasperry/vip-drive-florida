
-- Create or update passenger_preferences table with proper schema
CREATE TABLE IF NOT EXISTS public.passenger_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  air_conditioning BOOLEAN NOT NULL DEFAULT true,
  preferred_temperature INTEGER NOT NULL DEFAULT 71 CHECK (preferred_temperature BETWEEN 60 AND 85),
  temperature_unit TEXT NOT NULL DEFAULT 'F',
  radio_on BOOLEAN NOT NULL DEFAULT false,
  preferred_music TEXT NOT NULL DEFAULT 'no_preference' CHECK (preferred_music IN ('no_preference','classical','jazz','pop','rock','electronic','off')),
  conversation_preference TEXT NOT NULL DEFAULT 'depends' CHECK (conversation_preference IN ('chatty','prefers_silence','depends')),
  trip_purpose TEXT NOT NULL DEFAULT 'other' CHECK (trip_purpose IN ('business','leisure','airport','events','medical','other')),
  trip_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on passenger_preferences
ALTER TABLE public.passenger_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON public.passenger_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_passenger_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_passenger_preferences_updated_at
  BEFORE UPDATE ON public.passenger_preferences
  FOR EACH ROW EXECUTE FUNCTION update_passenger_preferences_updated_at();

-- Update the upsert function to work with the correct schema
CREATE OR REPLACE FUNCTION public.upsert_my_passenger_preferences(
  _air_conditioning BOOLEAN,
  _preferred_temperature INTEGER,
  _temperature_unit TEXT,
  _radio_on BOOLEAN,
  _preferred_music TEXT,
  _conversation_preference TEXT,
  _trip_purpose TEXT,
  _trip_notes TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing user id for upsert';
  END IF;

  INSERT INTO public.passenger_preferences AS pp (
    user_id, air_conditioning, preferred_temperature, temperature_unit,
    radio_on, preferred_music, conversation_preference, trip_purpose, trip_notes
  )
  VALUES (
    v_user_id, _air_conditioning, _preferred_temperature, _temperature_unit,
    _radio_on, _preferred_music, _conversation_preference, _trip_purpose, _trip_notes
  )
  ON CONFLICT (user_id) DO UPDATE SET
    air_conditioning        = EXCLUDED.air_conditioning,
    preferred_temperature   = EXCLUDED.preferred_temperature,
    temperature_unit        = EXCLUDED.temperature_unit,
    radio_on                = EXCLUDED.radio_on,
    preferred_music         = EXCLUDED.preferred_music,
    conversation_preference = EXCLUDED.conversation_preference,
    trip_purpose            = EXCLUDED.trip_purpose,
    trip_notes              = EXCLUDED.trip_notes,
    updated_at              = now();
END;
$$;

-- Update the get function to work with the correct schema
CREATE OR REPLACE FUNCTION public.get_my_passenger_preferences()
RETURNS TABLE(
  air_conditioning BOOLEAN,
  preferred_temperature INTEGER,
  temperature_unit TEXT,
  radio_on BOOLEAN,
  preferred_music TEXT,
  conversation_preference TEXT,
  trip_purpose TEXT,
  trip_notes TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    air_conditioning,
    preferred_temperature,
    temperature_unit,
    radio_on,
    preferred_music,
    conversation_preference,
    trip_purpose,
    trip_notes
  FROM public.passenger_preferences
  WHERE user_id = auth.uid();
$$;
