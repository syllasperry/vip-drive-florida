-- Add separate vehicle information columns to drivers table
ALTER TABLE drivers 
ADD COLUMN car_make TEXT,
ADD COLUMN car_model TEXT, 
ADD COLUMN car_year TEXT,
ADD COLUMN car_color TEXT;

-- Update existing car_type data to populate new fields
UPDATE drivers 
SET 
  car_year = CASE 
    WHEN car_type IS NOT NULL AND car_type != '' 
    THEN split_part(car_type, ' ', 1)
    ELSE NULL 
  END,
  car_make = CASE 
    WHEN car_type IS NOT NULL AND car_type != '' 
    THEN split_part(car_type, ' ', 2)
    ELSE NULL 
  END,
  car_model = CASE 
    WHEN car_type IS NOT NULL AND car_type != '' AND array_length(string_to_array(car_type, ' '), 1) >= 3
    THEN array_to_string(string_to_array(car_type, ' ')[3:], ' ')
    ELSE NULL 
  END
WHERE car_type IS NOT NULL AND car_type != '';