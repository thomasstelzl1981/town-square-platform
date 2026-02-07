-- Add expose headline fields to units table
ALTER TABLE units 
ADD COLUMN IF NOT EXISTS expose_headline TEXT,
ADD COLUMN IF NOT EXISTS expose_subline TEXT;

-- Comment for clarity
COMMENT ON COLUMN units.expose_headline IS 'Main headline for the sales/rental exposé';
COMMENT ON COLUMN units.expose_subline IS 'Subtitle/tagline for the sales/rental exposé';