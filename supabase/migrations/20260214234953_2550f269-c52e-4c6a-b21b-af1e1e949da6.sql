
-- Add active_connector column to pv_plants
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS active_connector text DEFAULT 'demo_timo_leif';

-- Enable realtime for pv_measurements
ALTER PUBLICATION supabase_realtime ADD TABLE public.pv_measurements;
