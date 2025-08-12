
-- Create passenger_preferences table
CREATE TABLE public.passenger_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  air_conditioning BOOLEAN DEFAULT true,
  preferred_temperature INTEGER DEFAULT 72,
  temperature_unit TEXT DEFAULT 'F' CHECK (temperature_unit IN ('F', 'C')),
  radio_on BOOLEAN DEFAULT false,
  preferred_music TEXT,
  conversation_preference TEXT DEFAULT 'neutral' CHECK (conversation_preference IN ('quiet', 'neutral', 'chatty')),
  trip_purpose TEXT DEFAULT 'leisure' CHECK (trip_purpose IN ('leisure', 'business', 'event', 'other')),
  trip_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.passenger_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own preferences" 
  ON public.passenger_preferences 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_passenger_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_passenger_preferences_updated_at
  BEFORE UPDATE ON public.passenger_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_passenger_preferences_updated_at();
