-- Add unit_id column to listings table for unit-based sales
ALTER TABLE listings ADD COLUMN unit_id UUID REFERENCES units(id);

-- Create index for performance
CREATE INDEX idx_listings_unit_id ON listings(unit_id);

-- Add comment for documentation
COMMENT ON COLUMN listings.unit_id IS 'Reference to the specific unit being sold. Enables unit-level sales listings.';