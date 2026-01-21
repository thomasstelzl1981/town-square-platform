-- =============================================
-- MIGRATION 1: CORE BUSINESS TABLES
-- Phase 1.3A: properties, units, contacts, documents
-- =============================================

-- PROPERTIES (mit DB + E Feldtrennung gemäß Excel)
CREATE TABLE public.properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- DB-FELDER (Dashboard-Liste)
  code            TEXT,
  property_type   TEXT NOT NULL DEFAULT 'MFH',
  city            TEXT NOT NULL,
  address         TEXT NOT NULL,
  total_area_sqm  DECIMAL(12,2),
  usage_type      TEXT NOT NULL DEFAULT 'Vermietung',
  annual_income   DECIMAL(14,2),
  market_value    DECIMAL(14,2),
  management_fee  DECIMAL(12,2),
  
  -- E-FELDER (Exposé-Detail)
  postal_code          TEXT,
  year_built           INTEGER,
  land_register_court  TEXT,
  land_register_sheet  TEXT,
  land_register_volume TEXT,
  parcel_number        TEXT,
  unit_ownership_nr    TEXT,
  notary_date          DATE,
  bnl_date             DATE,
  renovation_year      INTEGER,
  purchase_price       DECIMAL(14,2),
  energy_source        TEXT,
  heating_type         TEXT,
  description          TEXT,
  
  country         TEXT NOT NULL DEFAULT 'DE',
  status          TEXT NOT NULL DEFAULT 'available',
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UNITS (1 Default-Unit pro Property in Phase 1)
CREATE TABLE public.units (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL,
  
  unit_number     TEXT NOT NULL DEFAULT 'MAIN',
  floor           INTEGER,
  area_sqm        DECIMAL(10,2),
  rooms           DECIMAL(3,1),
  usage_type      TEXT DEFAULT 'residential',
  
  current_monthly_rent DECIMAL(12,2),
  ancillary_costs      DECIMAL(12,2),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONTACTS
CREATE TABLE public.contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  notes       TEXT,
  
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DOCUMENTS
CREATE TABLE public.documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name           TEXT NOT NULL,
  file_path      TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  size_bytes     BIGINT NOT NULL,
  uploaded_by    UUID REFERENCES auth.users(id),
  
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite Unique Constraints für Foreign Keys
ALTER TABLE properties ADD CONSTRAINT properties_tenant_id_unique UNIQUE(tenant_id, id);
ALTER TABLE units ADD CONSTRAINT units_tenant_id_unique UNIQUE(tenant_id, id);
ALTER TABLE contacts ADD CONSTRAINT contacts_tenant_id_unique UNIQUE(tenant_id, id);
ALTER TABLE documents ADD CONSTRAINT documents_tenant_id_unique UNIQUE(tenant_id, id);

-- Foreign Key für units -> properties (mit composite)
ALTER TABLE units ADD CONSTRAINT units_property_fk 
  FOREIGN KEY (tenant_id, property_id) REFERENCES properties(tenant_id, id) ON DELETE CASCADE;

-- Unique constraint für unit_number pro property
ALTER TABLE units ADD CONSTRAINT units_property_unit_number_unique UNIQUE(property_id, unit_number);

-- Indexes
CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_properties_city ON properties(tenant_id, city);
CREATE UNIQUE INDEX idx_properties_code ON properties(tenant_id, code) WHERE code IS NOT NULL;
CREATE INDEX idx_units_tenant ON units(tenant_id);
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_email ON contacts(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_documents_tenant ON documents(tenant_id);

-- Auto-Create Default Unit bei Property-Insert
CREATE OR REPLACE FUNCTION public.create_default_unit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO units (tenant_id, property_id, unit_number, area_sqm)
  VALUES (NEW.tenant_id, NEW.id, 'MAIN', NEW.total_area_sqm);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_property_create_default_unit
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION create_default_unit();

-- Updated_at Triggers
CREATE TRIGGER trg_properties_updated_at 
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_units_updated_at 
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contacts_updated_at 
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at 
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROPERTIES RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY prop_select_platform_admin ON properties
  FOR SELECT USING (is_platform_admin());

CREATE POLICY prop_insert_platform_admin ON properties
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY prop_update_platform_admin ON properties
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY prop_delete_platform_admin ON properties
  FOR DELETE USING (is_platform_admin());

CREATE POLICY prop_select_member ON properties
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = properties.tenant_id)
  );

CREATE POLICY prop_insert_member ON properties
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = properties.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY prop_update_member ON properties
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = properties.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY prop_delete_member ON properties
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = properties.tenant_id
            AND m.role = 'org_admin')
  );

-- UNITS RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

CREATE POLICY units_select_platform_admin ON units
  FOR SELECT USING (is_platform_admin());

CREATE POLICY units_insert_platform_admin ON units
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY units_update_platform_admin ON units
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY units_delete_platform_admin ON units
  FOR DELETE USING (is_platform_admin());

CREATE POLICY units_select_member ON units
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = units.tenant_id)
  );

CREATE POLICY units_insert_member ON units
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = units.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY units_update_member ON units
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = units.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY units_delete_member ON units
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = units.tenant_id
            AND m.role = 'org_admin')
  );

-- CONTACTS RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select_platform_admin ON contacts
  FOR SELECT USING (is_platform_admin());

CREATE POLICY contacts_insert_platform_admin ON contacts
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY contacts_update_platform_admin ON contacts
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY contacts_delete_platform_admin ON contacts
  FOR DELETE USING (is_platform_admin());

CREATE POLICY contacts_select_member ON contacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = contacts.tenant_id)
  );

CREATE POLICY contacts_insert_member ON contacts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = contacts.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY contacts_update_member ON contacts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = contacts.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY contacts_delete_member ON contacts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = contacts.tenant_id
            AND m.role = 'org_admin')
  );

-- DOCUMENTS RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY docs_select_platform_admin ON documents
  FOR SELECT USING (is_platform_admin());

CREATE POLICY docs_insert_platform_admin ON documents
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY docs_update_platform_admin ON documents
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY docs_delete_platform_admin ON documents
  FOR DELETE USING (is_platform_admin());

CREATE POLICY docs_select_member ON documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = documents.tenant_id)
  );

CREATE POLICY docs_insert_member ON documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = documents.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY docs_update_member ON documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = documents.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY docs_delete_member ON documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = documents.tenant_id
            AND m.role = 'org_admin')
  );