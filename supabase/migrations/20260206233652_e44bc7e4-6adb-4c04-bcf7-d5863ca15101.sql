-- Extend investment_favorites for MOD-08 Investment Search
-- Add columns for search parameters, calculated burden, and listing reference

-- Add search_params column for storing zVE, EK, tax settings
ALTER TABLE investment_favorites 
ADD COLUMN IF NOT EXISTS search_params JSONB DEFAULT '{}';

COMMENT ON COLUMN investment_favorites.search_params IS 
  'Gespeicherte Suchparameter: zVE, EK, Familienstand, Kirchensteuer bei Favoritenerstellung';

-- Add calculated_burden for the monthly net burden
ALTER TABLE investment_favorites 
ADD COLUMN IF NOT EXISTS calculated_burden NUMERIC;

COMMENT ON COLUMN investment_favorites.calculated_burden IS 
  'Berechnete monatliche Netto-Belastung zum Zeitpunkt des Favoritensetzens';

-- Add listing_id for internal platform listings (vs external)
ALTER TABLE investment_favorites 
ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES listings(id) ON DELETE SET NULL;

COMMENT ON COLUMN investment_favorites.listing_id IS 
  'Referenz auf internes Listing (NULL bei externen Quellen wie Kaufy-Import)';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_investment_favorites_listing 
ON investment_favorites(listing_id) WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_investment_favorites_user_status 
ON investment_favorites(investment_profile_id, status);