-- =============================================
-- MIGRATION 2: PROPERTY FEATURES + FINANCING
-- Phase 1.3B: property_features (ADR-021 Option B), property_financing
-- =============================================

-- PROPERTY_FINANCING (Bestandsfinanzierung, E-Felder)
CREATE TABLE public.property_financing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL,
  
  loan_number     TEXT,
  bank_name       TEXT,
  original_amount DECIMAL(14,2),
  current_balance DECIMAL(14,2),
  interest_rate   DECIMAL(5,3),
  fixed_until     DATE,
  monthly_rate    DECIMAL(12,2),
  annual_interest DECIMAL(14,2),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  FOREIGN KEY (tenant_id, property_id) 
    REFERENCES properties(tenant_id, id) ON DELETE CASCADE
);

-- PROPERTY_FEATURES (ADR-021 Option B)
CREATE TABLE public.property_features (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id     UUID NOT NULL,
  
  feature_code    TEXT NOT NULL CHECK (feature_code IN ('msv', 'kaufy', 'website_visibility')),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  activated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_by    UUID REFERENCES auth.users(id),
  deactivated_at  TIMESTAMPTZ,
  deactivated_by  UUID REFERENCES auth.users(id),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  FOREIGN KEY (tenant_id, property_id) 
    REFERENCES properties(tenant_id, id) ON DELETE CASCADE,
  UNIQUE(property_id, feature_code)
);

-- Indexes
CREATE INDEX idx_property_financing_tenant ON property_financing(tenant_id);
CREATE INDEX idx_property_financing_property ON property_financing(property_id);
CREATE INDEX idx_property_features_tenant ON property_features(tenant_id);
CREATE INDEX idx_property_features_property ON property_features(property_id);
CREATE INDEX idx_property_features_code ON property_features(feature_code, status);

-- Updated_at Triggers
CREATE TRIGGER trg_property_financing_updated_at 
  BEFORE UPDATE ON property_financing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_property_features_updated_at 
  BEFORE UPDATE ON property_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- PROPERTY_FINANCING RLS
ALTER TABLE property_financing ENABLE ROW LEVEL SECURITY;

CREATE POLICY pf_select_platform_admin ON property_financing
  FOR SELECT USING (is_platform_admin());

CREATE POLICY pf_insert_platform_admin ON property_financing
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY pf_update_platform_admin ON property_financing
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY pf_delete_platform_admin ON property_financing
  FOR DELETE USING (is_platform_admin());

CREATE POLICY pf_select_member ON property_financing
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = property_financing.tenant_id)
  );

CREATE POLICY pf_insert_member ON property_financing
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = property_financing.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY pf_update_member ON property_financing
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = property_financing.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY pf_delete_member ON property_financing
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = property_financing.tenant_id
            AND m.role = 'org_admin')
  );

-- PROPERTY_FEATURES RLS
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY pfeat_select_platform_admin ON property_features
  FOR SELECT USING (is_platform_admin());

CREATE POLICY pfeat_insert_platform_admin ON property_features
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY pfeat_update_platform_admin ON property_features
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY pfeat_delete_platform_admin ON property_features
  FOR DELETE USING (is_platform_admin());

CREATE POLICY pfeat_select_member ON property_features
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = property_features.tenant_id)
  );

CREATE POLICY pfeat_insert_member ON property_features
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = property_features.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY pfeat_update_member ON property_features
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = property_features.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY pfeat_delete_member ON property_features
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = property_features.tenant_id
            AND m.role = 'org_admin')
  );