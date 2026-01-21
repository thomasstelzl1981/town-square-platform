-- =============================================
-- MIGRATION 3B: LEASES TABELLE
-- Phase 1.4A: leases mit renter_org_id, Partial Unique Index
-- =============================================

-- LEASES
CREATE TABLE public.leases (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  unit_id           UUID NOT NULL,
  
  tenant_contact_id UUID NOT NULL,
  renter_org_id     UUID REFERENCES organizations(id),
  
  monthly_rent      DECIMAL(12,2) NOT NULL,
  deposit_amount    DECIMAL(12,2),
  start_date        DATE NOT NULL,
  end_date          DATE,
  
  status            TEXT NOT NULL DEFAULT 'draft' 
                    CHECK (status IN ('draft', 'active', 'notice_given', 'terminated', 'renewed')),
  
  notice_date       DATE,
  
  tenant_since      DATE,
  rent_increase     TEXT,
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite Unique for FK pattern
ALTER TABLE leases ADD CONSTRAINT leases_tenant_id_unique UNIQUE(tenant_id, id);

-- Foreign Keys mit Composite Pattern
ALTER TABLE leases ADD CONSTRAINT leases_unit_fk 
  FOREIGN KEY (tenant_id, unit_id) REFERENCES units(tenant_id, id) ON DELETE CASCADE;

ALTER TABLE leases ADD CONSTRAINT leases_contact_fk 
  FOREIGN KEY (tenant_id, tenant_contact_id) REFERENCES contacts(tenant_id, id) ON DELETE RESTRICT;

-- BUSINESS-REGEL: Max 1 aktiver Lease pro Unit
CREATE UNIQUE INDEX idx_leases_one_active_per_unit 
  ON leases(unit_id) 
  WHERE status IN ('active', 'notice_given');

-- Weitere Indexes
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_renter_org ON leases(renter_org_id) WHERE renter_org_id IS NOT NULL;
CREATE INDEX idx_leases_status ON leases(tenant_id, status);
CREATE INDEX idx_leases_contact ON leases(tenant_contact_id);

-- Updated_at Trigger
CREATE TRIGGER trg_leases_updated_at 
  BEFORE UPDATE ON leases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Platform Admin: God Mode
CREATE POLICY lease_select_platform_admin ON leases
  FOR SELECT USING (is_platform_admin());

CREATE POLICY lease_insert_platform_admin ON leases
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY lease_update_platform_admin ON leases
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY lease_delete_platform_admin ON leases
  FOR DELETE USING (is_platform_admin());

-- Vermieter: Full Access auf eigene Tenant-Leases
CREATE POLICY lease_select_landlord ON leases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = leases.tenant_id)
  );

CREATE POLICY lease_insert_landlord ON leases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = leases.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY lease_update_landlord ON leases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = leases.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY lease_delete_landlord ON leases
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = leases.tenant_id
            AND m.role = 'org_admin')
  );

-- Mieter: SELECT only (eigene Leases via renter_org_id)
CREATE POLICY lease_select_renter ON leases
  FOR SELECT USING (
    leases.renter_org_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = leases.renter_org_id
        AND m.role = 'renter_user'
    )
  );