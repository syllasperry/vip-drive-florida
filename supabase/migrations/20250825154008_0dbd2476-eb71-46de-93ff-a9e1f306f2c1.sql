
-- Ensure avatars storage bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create passenger preferences table
CREATE TABLE IF NOT EXISTS public.passenger_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  air_conditioning BOOLEAN DEFAULT true,
  preferred_temperature INTEGER DEFAULT 72,
  temperature_unit TEXT DEFAULT 'F' CHECK (temperature_unit IN ('F', 'C')),
  radio_on BOOLEAN DEFAULT true,
  preferred_music TEXT DEFAULT 'no_preference' CHECK (preferred_music IN ('no_preference', 'classical', 'jazz', 'pop', 'rock', 'electronic', 'off')),
  conversation_preference TEXT DEFAULT 'no_preference' CHECK (conversation_preference IN ('no_preference', 'quiet', 'friendly')),
  trip_purpose TEXT DEFAULT 'leisure' CHECK (trip_purpose IN ('business', 'leisure', 'airport', 'event', 'medical', 'other')),
  trip_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for passenger preferences
ALTER TABLE public.passenger_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for passenger preferences
CREATE POLICY "Users can manage their own preferences"
ON public.passenger_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_passenger_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_passenger_preferences_updated_at_trigger
  BEFORE UPDATE ON public.passenger_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_passenger_preferences_updated_at();

-- Create function to upsert passenger preferences
CREATE OR REPLACE FUNCTION upsert_my_passenger_preferences(
  _air_conditioning BOOLEAN,
  _preferred_temperature INTEGER,
  _temperature_unit TEXT,
  _radio_on BOOLEAN,
  _preferred_music TEXT,
  _conversation_preference TEXT,
  _trip_purpose TEXT,
  _trip_notes TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := COALESCE(
    auth.uid(),
    NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID
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
    air_conditioning = EXCLUDED.air_conditioning,
    preferred_temperature = EXCLUDED.preferred_temperature,
    temperature_unit = EXCLUDED.temperature_unit,
    radio_on = EXCLUDED.radio_on,
    preferred_music = EXCLUDED.preferred_music,
    conversation_preference = EXCLUDED.conversation_preference,
    trip_purpose = EXCLUDED.trip_purpose,
    trip_notes = EXCLUDED.trip_notes,
    updated_at = now();
END;
$$;

-- Create function to get passenger preferences
CREATE OR REPLACE FUNCTION get_my_passenger_preferences()
RETURNS TABLE (
  air_conditioning BOOLEAN,
  preferred_temperature INTEGER,
  temperature_unit TEXT,
  radio_on BOOLEAN,
  preferred_music TEXT,
  conversation_preference TEXT,
  trip_purpose TEXT,
  trip_notes TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    air_conditioning,
    preferred_temperature,
    temperature_unit,
    radio_on,
    preferred_music,
    conversation_preference,      -- <- nome certo
    trip_purpose,
    trip_notes
  FROM public.passenger_preferences
  WHERE user_id = auth.uid();
$$;
