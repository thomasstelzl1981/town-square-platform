-- Add vehicle_type column to distinguish autos from bikes
ALTER TABLE public.cars_vehicles
ADD COLUMN IF NOT EXISTS vehicle_type text NOT NULL DEFAULT 'auto';

-- Add index for vehicle_type filtering
CREATE INDEX IF NOT EXISTS idx_cars_vehicles_vehicle_type ON public.cars_vehicles(vehicle_type);

COMMENT ON COLUMN public.cars_vehicles.vehicle_type IS 'Type of vehicle: auto, bike, boat, jet';