-- =============================================
-- MIGRATION 4: RENTER-INVITES + ACCESS-GRANTS
-- Phase 1.4B: renter_invites, access_grants
-- =============================================

-- RENTER_INVITES (Audit-fähiges Invite-Tracking)
CREATE TABLE public.renter_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lease_id        UUID NOT NULL,
  unit_id         UUID NOT NULL,
  contact_id      UUID NOT NULL,
  
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email           TEXT NOT NULL,
  
  status          TEXT NOT NULL DEFAULT 'pending' 
                  CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at     TIMESTAMPTZ,
  
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  revoked_by      UUID REFERENCES auth.users(id),
  revoked_at      TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign Keys mit Composite Pattern
ALTER TABLE renter_invites ADD CONSTRAINT ri_lease_fk 
  FOREIGN KEY (tenant_id, lease_id) REFERENCES leases(tenant_id, id) ON DELETE CASCADE;

ALTER TABLE renter_invites ADD CONSTRAINT ri_unit_fk 
  FOREIGN KEY (tenant_id, unit_id) REFERENCES units(tenant_id, id) ON DELETE CASCADE;

ALTER TABLE renter_invites ADD CONSTRAINT ri_contact_fk 
  FOREIGN KEY (tenant_id, contact_id) REFERENCES contacts(tenant_id, id) ON DELETE RESTRICT;

-- Nur 1 pending invite pro Lease
CREATE UNIQUE INDEX idx_renter_invites_pending_per_lease 
  ON renter_invites(lease_id) WHERE status = 'pending';

-- Weitere Indexes
CREATE INDEX idx_renter_invites_tenant ON renter_invites(tenant_id);
CREATE INDEX idx_renter_invites_token ON renter_invites(token);
CREATE INDEX idx_renter_invites_status ON renter_invites(status);
CREATE INDEX idx_renter_invites_email ON renter_invites(email);

-- ACCESS_GRANTS (explizites Document-Sharing, ADR-024)
CREATE TABLE public.access_grants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  scope_type     TEXT NOT NULL CHECK (scope_type = 'document'),
  scope_id       UUID NOT NULL,
  
  subject_type   TEXT NOT NULL CHECK (subject_type = 'organization'),
  subject_id     UUID NOT NULL,
  
  can_view       BOOLEAN NOT NULL DEFAULT true,
  can_download   BOOLEAN NOT NULL DEFAULT false,
  
  expires_at     TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  
  granted_by     UUID REFERENCES auth.users(id),
  revoked_by     UUID REFERENCES auth.users(id),
  revoked_at     TIMESTAMPTZ,
  
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_access_grants_tenant ON access_grants(tenant_id);
CREATE INDEX idx_access_grants_scope ON access_grants(scope_type, scope_id);
CREATE INDEX idx_access_grants_subject ON access_grants(subject_type, subject_id);
CREATE INDEX idx_access_grants_status ON access_grants(status);

-- Updated_at Trigger für access_grants
CREATE TRIGGER trg_access_grants_updated_at 
  BEFORE UPDATE ON access_grants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS POLICIES
-- =============================================

-- RENTER_INVITES RLS
ALTER TABLE renter_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY ri_select_platform_admin ON renter_invites
  FOR SELECT USING (is_platform_admin());

CREATE POLICY ri_insert_platform_admin ON renter_invites
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY ri_update_platform_admin ON renter_invites
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY ri_delete_platform_admin ON renter_invites
  FOR DELETE USING (is_platform_admin());

-- Vermieter: Full Access
CREATE POLICY ri_select_landlord ON renter_invites
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() AND m.tenant_id = renter_invites.tenant_id)
  );

CREATE POLICY ri_insert_landlord ON renter_invites
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = renter_invites.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

CREATE POLICY ri_update_landlord ON renter_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = renter_invites.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

-- ACCESS_GRANTS RLS
ALTER TABLE access_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY ag_select_platform_admin ON access_grants
  FOR SELECT USING (is_platform_admin());

CREATE POLICY ag_insert_platform_admin ON access_grants
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY ag_update_platform_admin ON access_grants
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY ag_delete_platform_admin ON access_grants
  FOR DELETE USING (is_platform_admin());

-- Vermieter: Full Access
CREATE POLICY ag_all_landlord ON access_grants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM memberships m 
            WHERE m.user_id = auth.uid() 
            AND m.tenant_id = access_grants.tenant_id
            AND m.role IN ('org_admin', 'internal_ops'))
  );

-- Mieter: SELECT eigene Grants
CREATE POLICY ag_select_renter ON access_grants
  FOR SELECT USING (
    access_grants.subject_type = 'organization'
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = access_grants.subject_id
    )
  );

-- DOCUMENTS: Erweiterte RLS für geteilte Dokumente (via access_grants)
CREATE POLICY docs_select_via_grant ON documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM access_grants ag
      JOIN memberships m ON m.tenant_id = ag.subject_id
      WHERE ag.scope_type = 'document'
        AND ag.scope_id = documents.id
        AND ag.subject_type = 'organization'
        AND ag.status = 'active'
        AND ag.can_view = true
        AND (ag.expires_at IS NULL OR ag.expires_at > now())
        AND m.user_id = auth.uid()
    )
  );