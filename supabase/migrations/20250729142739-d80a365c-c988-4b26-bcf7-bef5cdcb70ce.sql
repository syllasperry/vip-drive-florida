-- Add passenger preferences columns
ALTER TABLE passengers 
ADD COLUMN preferred_temperature INTEGER,
ADD COLUMN music_preference TEXT,
ADD COLUMN music_playlist_link TEXT,
ADD COLUMN interaction_preference TEXT,
ADD COLUMN trip_purpose TEXT,
ADD COLUMN additional_notes TEXT;