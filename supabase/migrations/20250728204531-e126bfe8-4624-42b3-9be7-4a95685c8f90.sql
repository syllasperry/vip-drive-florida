-- Add vehicle type mapping and update bookings table structure
-- First, add a vehicle_type column to bookings table
ALTER TABLE bookings ADD COLUMN vehicle_type TEXT;

-- Create a vehicle type mapping table for consistent matching
CREATE TABLE vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  code_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vehicle_types
ALTER TABLE vehicle_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read vehicle types
CREATE POLICY "Anyone can view vehicle types" 
ON vehicle_types 
FOR SELECT 
USING (true);

-- Insert the predefined vehicle types for matching
INSERT INTO vehicle_types (vehicle_name, make, model, code_name) VALUES
('Tesla Model Y', 'Tesla', 'Model Y', 'electric_car'),
('BMW Sedan', 'BMW', '5 Series', 'luxury_sedan'),
('Chevrolet SUV', 'Chevrolet', 'Tahoe', 'luxury_suv'),
('Mercedes-Benz Van', 'Mercedes-Benz', 'Sprinter', 'luxury_van');

-- Create a function to find matching drivers for a booking
CREATE OR REPLACE FUNCTION find_matching_drivers(
  p_vehicle_make TEXT,
  p_vehicle_model TEXT
) RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  driver_email TEXT,
  driver_phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.full_name,
    d.email,
    d.phone
  FROM drivers d
  WHERE 
    LOWER(TRIM(d.car_make)) = LOWER(TRIM(p_vehicle_make))
    AND LOWER(TRIM(d.car_model)) = LOWER(TRIM(p_vehicle_model))
    AND d.car_make IS NOT NULL 
    AND d.car_model IS NOT NULL
    AND d.car_make != ''
    AND d.car_model != '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;