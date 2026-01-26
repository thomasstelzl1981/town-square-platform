-- =====================================================
-- MOD-05 MSV: Rental Listings & Publications
-- Vermietungsexposé und Publishing-Kanäle
-- =====================================================

-- Table: rental_listings
-- Stores rental listing data for properties/units
CREATE TABLE rental_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  public_id text NOT NULL DEFAULT generate_public_id('V'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'rented')),
  cold_rent numeric,
  utilities_estimate numeric,
  warm_rent numeric GENERATED ALWAYS AS (COALESCE(cold_rent, 0) + COALESCE(utilities_estimate, 0)) STORED,
  deposit_months int DEFAULT 2 CHECK (deposit_months >= 0 AND deposit_months <= 6),
  available_from date,
  minimum_term_months int,
  pets_allowed boolean DEFAULT false,
  description text,
  expose_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Composite FK for tenant isolation
  CONSTRAINT rental_listings_tenant_property_fk 
    FOREIGN KEY (tenant_id, property_id) 
    REFERENCES properties(tenant_id, id)
);

-- Indexes
CREATE INDEX idx_rental_listings_tenant ON rental_listings(tenant_id);
CREATE INDEX idx_rental_listings_property ON rental_listings(property_id);
CREATE INDEX idx_rental_listings_status ON rental_listings(status);

-- RLS
ALTER TABLE rental_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant rental_listings"
  ON rental_listings FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert own tenant rental_listings"
  ON rental_listings FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update own tenant rental_listings"
  ON rental_listings FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete own tenant rental_listings"
  ON rental_listings FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_rental_listings_updated_at
  BEFORE UPDATE ON rental_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Table: rental_publications
-- Tracks where rental listings are published (Scout24, Kleinanzeigen)
-- =====================================================

CREATE TABLE rental_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rental_listing_id uuid NOT NULL REFERENCES rental_listings(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('scout24', 'kleinanzeigen')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'removed', 'failed')),
  external_url text,
  external_id text,
  published_at timestamptz,
  expires_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One publication per channel per listing
  UNIQUE (rental_listing_id, channel)
);

-- Indexes
CREATE INDEX idx_rental_publications_tenant ON rental_publications(tenant_id);
CREATE INDEX idx_rental_publications_listing ON rental_publications(rental_listing_id);
CREATE INDEX idx_rental_publications_channel ON rental_publications(channel);

-- RLS
ALTER TABLE rental_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant rental_publications"
  ON rental_publications FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert own tenant rental_publications"
  ON rental_publications FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update own tenant rental_publications"
  ON rental_publications FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete own tenant rental_publications"
  ON rental_publications FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_rental_publications_updated_at
  BEFORE UPDATE ON rental_publications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();