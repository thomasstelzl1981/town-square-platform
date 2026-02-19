
-- =============================================
-- COMPLIANCE DESK MVP — 7 Tables + RLS + Seeds
-- =============================================

-- 1. compliance_company_profile (Single-row Platform SSOT)
CREATE TABLE public.compliance_company_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT '',
  legal_form TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'DE',
  email TEXT,
  phone TEXT,
  managing_directors JSONB DEFAULT '[]'::jsonb,
  commercial_register JSONB DEFAULT '{}'::jsonb,
  vat_id TEXT,
  supervisory_authority TEXT,
  website_url TEXT,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.compliance_company_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ccp_select_authenticated" ON public.compliance_company_profile
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ccp_insert_platform_admin" ON public.compliance_company_profile
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "ccp_update_platform_admin" ON public.compliance_company_profile
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "ccp_delete_platform_admin" ON public.compliance_company_profile
  FOR DELETE TO authenticated USING (is_platform_admin());

-- 2. compliance_documents (Legaltext-Katalog)
CREATE TABLE public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_key TEXT UNIQUE NOT NULL,
  doc_type TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'portal',
  brand TEXT,
  locale TEXT DEFAULT 'de-DE',
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  current_version INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cd_select_authenticated" ON public.compliance_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cd_insert_platform_admin" ON public.compliance_documents
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "cd_update_platform_admin" ON public.compliance_documents
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "cd_delete_platform_admin" ON public.compliance_documents
  FOR DELETE TO authenticated USING (is_platform_admin());

-- 3. compliance_document_versions (Versionierung)
CREATE TABLE public.compliance_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.compliance_documents(id) ON DELETE CASCADE,
  version INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  content_md TEXT NOT NULL DEFAULT '',
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  activated_at TIMESTAMPTZ,
  UNIQUE(document_id, version)
);

ALTER TABLE public.compliance_document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cdv_select_authenticated" ON public.compliance_document_versions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cdv_insert_platform_admin" ON public.compliance_document_versions
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "cdv_update_platform_admin" ON public.compliance_document_versions
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "cdv_delete_platform_admin" ON public.compliance_document_versions
  FOR DELETE TO authenticated USING (is_platform_admin());

-- 4. compliance_bundles (TermsGate Bundles)
CREATE TABLE public.compliance_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_select_authenticated" ON public.compliance_bundles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cb_insert_platform_admin" ON public.compliance_bundles
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "cb_update_platform_admin" ON public.compliance_bundles
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "cb_delete_platform_admin" ON public.compliance_bundles
  FOR DELETE TO authenticated USING (is_platform_admin());

-- 5. compliance_bundle_items (Bundle-Zuordnung)
CREATE TABLE public.compliance_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.compliance_bundles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.compliance_documents(id),
  required_version INT,
  required BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.compliance_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cbi_select_authenticated" ON public.compliance_bundle_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cbi_insert_platform_admin" ON public.compliance_bundle_items
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "cbi_update_platform_admin" ON public.compliance_bundle_items
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "cbi_delete_platform_admin" ON public.compliance_bundle_items
  FOR DELETE TO authenticated USING (is_platform_admin());

-- 6. dsar_requests (DSGVO Art. 15)
CREATE TABLE public.dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id),
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  request_type TEXT NOT NULL DEFAULT 'access',
  status TEXT NOT NULL DEFAULT 'open',
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dsar_select_tenant" ON public.dsar_requests
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id() OR is_platform_admin());
CREATE POLICY "dsar_insert_admin" ON public.dsar_requests
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "dsar_update_admin" ON public.dsar_requests
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "dsar_delete_admin" ON public.dsar_requests
  FOR DELETE TO authenticated USING (is_platform_admin());

CREATE INDEX idx_dsar_requests_tenant_created ON public.dsar_requests(tenant_id, created_at);

-- 7. deletion_requests (DSGVO Art. 17)
CREATE TABLE public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id),
  requester_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  legal_hold_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "del_select_tenant" ON public.deletion_requests
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id() OR is_platform_admin());
CREATE POLICY "del_insert_admin" ON public.deletion_requests
  FOR INSERT TO authenticated WITH CHECK (is_platform_admin());
CREATE POLICY "del_update_admin" ON public.deletion_requests
  FOR UPDATE TO authenticated USING (is_platform_admin());
CREATE POLICY "del_delete_admin" ON public.deletion_requests
  FOR DELETE TO authenticated USING (is_platform_admin());

CREATE INDEX idx_deletion_requests_tenant_created ON public.deletion_requests(tenant_id, created_at);

-- =============================================
-- SEED DATA: 15 Placeholder Documents
-- =============================================
INSERT INTO public.compliance_documents (doc_key, doc_type, scope, brand, title, description) VALUES
  ('portal_agb', 'portal_agb', 'portal', NULL, 'Allgemeine Geschäftsbedingungen', 'AGB für das Portal'),
  ('portal_privacy', 'portal_privacy', 'portal', NULL, 'Datenschutzerklärung Portal', 'Datenschutz für das Portal'),
  ('portal_security_notice', 'portal_security_notice', 'portal', NULL, 'Sicherheitshinweise', 'Sicherheitshinweise für Nutzer'),
  ('website_imprint_kaufy', 'website_imprint', 'website', 'kaufy', 'Impressum Kaufy', 'Impressum für kaufy.de'),
  ('website_privacy_kaufy', 'website_privacy', 'website', 'kaufy', 'Datenschutz Kaufy', 'Datenschutzerklärung für kaufy.de'),
  ('website_imprint_futureroom', 'website_imprint', 'website', 'futureroom', 'Impressum FutureRoom', 'Impressum für futureroom.de'),
  ('website_privacy_futureroom', 'website_privacy', 'website', 'futureroom', 'Datenschutz FutureRoom', 'Datenschutzerklärung für futureroom.de'),
  ('website_imprint_sot', 'website_imprint', 'website', 'sot', 'Impressum System of a Town', 'Impressum für systemofatown.de'),
  ('website_privacy_sot', 'website_privacy', 'website', 'sot', 'Datenschutz System of a Town', 'Datenschutzerklärung für systemofatown.de'),
  ('website_imprint_acquiary', 'website_imprint', 'website', 'acquiary', 'Impressum Acquiary', 'Impressum für acquiary.de'),
  ('website_privacy_acquiary', 'website_privacy', 'website', 'acquiary', 'Datenschutz Acquiary', 'Datenschutzerklärung für acquiary.de'),
  ('website_imprint_tierservice', 'website_imprint', 'website', 'tierservice', 'Impressum Lennox & Friends', 'Impressum für lennoxandfriends.de'),
  ('website_privacy_tierservice', 'website_privacy', 'website', 'tierservice', 'Datenschutz Lennox & Friends', 'Datenschutzerklärung für lennoxandfriends.de'),
  ('internal_retention_policy', 'internal_retention_policy', 'internal', NULL, 'Aufbewahrungsrichtlinie', 'Interne Datenlöschfristen'),
  ('internal_subprocessor_register', 'internal_subprocessor_register', 'internal', NULL, 'Auftragsverarbeiter-Verzeichnis', 'Liste aller Unterauftragsverarbeiter');

-- SEED: 1 MVP Bundle
INSERT INTO public.compliance_bundles (bundle_key, title, description) VALUES
  ('BUNDLE_PORTAL_ONBOARDING', 'Portal Onboarding', 'AGB + Datenschutz bei Portal-Registrierung');

-- Link bundle items (portal_agb + portal_privacy)
INSERT INTO public.compliance_bundle_items (bundle_id, document_id, required_version, required, sort_order)
SELECT b.id, d.id, 1, true, 1
FROM public.compliance_bundles b, public.compliance_documents d
WHERE b.bundle_key = 'BUNDLE_PORTAL_ONBOARDING' AND d.doc_key = 'portal_agb';

INSERT INTO public.compliance_bundle_items (bundle_id, document_id, required_version, required, sort_order)
SELECT b.id, d.id, 1, true, 2
FROM public.compliance_bundles b, public.compliance_documents d
WHERE b.bundle_key = 'BUNDLE_PORTAL_ONBOARDING' AND d.doc_key = 'portal_privacy';

-- =============================================
-- LEDGER WHITELIST: Add legal.* events
-- =============================================
DROP FUNCTION IF EXISTS public.log_data_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB);

CREATE OR REPLACE FUNCTION public.log_data_event(
  p_tenant_id UUID,
  p_zone TEXT,
  p_event_type TEXT,
  p_direction TEXT,
  p_source TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_allowed_types TEXT[] := ARRAY[
    'document.uploaded','document.signed_url.view','document.signed_url.download',
    'access_grant.created','access_grant.revoked',
    'inbound.email.received','outbound.email.sent','inbound.webhook.received',
    'listing.published','listing.unpublished',
    'tenant.reset.started','tenant.reset.completed','data.purge.executed',
    'finance.request.submitted','finance.mandate.assigned','finance.bank.submitted',
    'acq.mandate.submitted','acq.mandate.assigned','acq.offer.created',
    'project.created','project.phase.changed',
    'renter.invite.sent','renter.invite.accepted',
    'renter.invite.expired','renter.org.provisioned','data_room.access.granted',
    'lead.captured','lead.assigned',
    'mod05.visibility.error',
    'sales.desk.submit.timeout','sales.desk.submit.error',
    'listing.distribution.timeout','listing.distribution.rejected','listing.distribution.duplicate_detected','listing.distribution.error',
    'finance.handoff.timeout','finance.handoff.error',
    'project.intake.timeout','project.intake.error',
    'finance.request.submit.timeout','finance.request.submit.duplicate_detected','finance.request.submit.error',
    'finance.mandate.assignment.timeout','finance.mandate.assignment.rejected','finance.mandate.assignment.error',
    'finance.bank.submit.timeout','finance.bank.submit.error',
    'acq.mandate.submit.timeout','acq.mandate.submit.duplicate_detected','acq.mandate.submit.error',
    'acq.mandate.assignment.timeout','acq.mandate.assignment.rejected','acq.mandate.assignment.error',
    'acq.outbound.response.timeout','acq.outbound.send.error',
    'project.phase.change.timeout','project.phase.change.error',
    'project.listing.distribution.timeout','project.listing.distribution.rejected','project.listing.distribution.error',
    'project.landing_page.timeout','project.landing_page.error',
    'renter.invite.send.timeout','renter.invite.duplicate_detected','renter.invite.send.error',
    'renter.invite.rejected','renter.invite.accept.error',
    'renter.data_room.activation.error','renter.portal.activation.error',
    'consent.given','consent.revoked','consent.updated',
    'applicant_profile.updated','applicant_profile.delete_requested','applicant_profile.deleted',
    'contact.updated','contact.delete_requested','contact.deleted',
    'profile.updated','profile.delete_requested','profile.deleted',
    'module.freeze.enabled','module.freeze.disabled',
    -- LEGAL / COMPLIANCE events
    'legal.company.updated',
    'legal.document.created','legal.document.version_created','legal.document.activated','legal.document.deprecated',
    'legal.bundle.created','legal.bundle.activated','legal.bundle.updated',
    'legal.dsar.created','legal.dsar.status_changed','legal.dsar.closed',
    'legal.deletion.created','legal.deletion.status_changed','legal.deletion.executed'
  ];
  v_allowed_keys JSONB;
  v_payload_keys TEXT[];
  v_key TEXT;
  v_max_payload_size INT := 4096;
  v_event_allowed_keys TEXT[];
BEGIN
  IF p_event_type IS NULL OR NOT (p_event_type = ANY(v_allowed_types)) THEN
    RAISE EXCEPTION 'Invalid event_type: %', COALESCE(p_event_type, 'NULL');
  END IF;
  IF p_direction NOT IN ('ingress', 'egress', 'mutate', 'delete') THEN
    RAISE EXCEPTION 'Invalid direction: %', p_direction;
  END IF;
  IF octet_length(p_payload::text) > v_max_payload_size THEN
    RAISE EXCEPTION 'Payload too large: % bytes (max %)', octet_length(p_payload::text), v_max_payload_size;
  END IF;

  v_allowed_keys := '{
    "document.uploaded": ["bucket","file_path","mime_type","size_bytes","document_id","module_code"],
    "document.signed_url.view": ["document_id","expires_in","mime_type","size_bytes"],
    "document.signed_url.download": ["document_id","expires_in","mime_type","size_bytes"],
    "access_grant.created": ["grant_id","scope_type","scope_id","subject_type"],
    "access_grant.revoked": ["grant_id","scope_type","scope_id","reason"],
    "inbound.email.received": ["inbound_id","from_domain_hash","subject_length","attachment_count"],
    "outbound.email.sent": ["campaign_id","recipient_count","status","sequence_id","enrollment_id","step"],
    "inbound.webhook.received": ["webhook_type","source_system","payload_size"],
    "listing.published": ["listing_id","channel","partner_visibility"],
    "listing.unpublished": ["listing_id","channel","reason"],
    "tenant.reset.started": ["tenant_id","triggered_by"],
    "tenant.reset.completed": ["tenant_id","reason","correlation_id","tables_deleted","storage_deleted","duration_ms"],
    "data.purge.executed": ["reason","correlation_id","deleted_count","oldest_remaining","retention_days","duration_ms"],
    "consent.given": ["consent_type","agreement_id","scope","context"],
    "consent.revoked": ["consent_type","agreement_id","scope","reason"],
    "consent.updated": ["consent_type","agreement_id","scope","changes"],
    "applicant_profile.updated": ["record_id","table_name","changed_fields"],
    "applicant_profile.delete_requested": ["record_id","table_name"],
    "applicant_profile.deleted": ["record_id","table_name"],
    "contact.updated": ["record_id","table_name","changed_fields"],
    "contact.delete_requested": ["record_id","table_name"],
    "contact.deleted": ["record_id","table_name"],
    "profile.updated": ["record_id","table_name","changed_fields"],
    "profile.delete_requested": ["record_id","table_name"],
    "profile.deleted": ["record_id","table_name"],
    "renter.invite.sent": ["invite_id","lease_id","email_hash"],
    "renter.invite.accepted": ["invite_id","lease_id","renter_org_id"],
    "renter.invite.expired": ["invite_id","lease_id"],
    "renter.org.provisioned": ["org_id","lease_id","renter_name"],
    "data_room.access.granted": ["grant_id","lease_id","renter_org_id"],
    "module.freeze.enabled": ["module_code","new_state","reason","actor_user_id"],
    "module.freeze.disabled": ["module_code","new_state","reason","actor_user_id"],
    "legal.company.updated": ["changed_fields"],
    "legal.document.created": ["doc_key","doc_type","scope","brand"],
    "legal.document.version_created": ["doc_key","version","change_note"],
    "legal.document.activated": ["doc_key","version"],
    "legal.document.deprecated": ["doc_key","version","reason"],
    "legal.bundle.created": ["bundle_key","title"],
    "legal.bundle.activated": ["bundle_key","item_count"],
    "legal.bundle.updated": ["bundle_key","changed_fields"],
    "legal.dsar.created": ["request_type","requester_email_hash"],
    "legal.dsar.status_changed": ["old_status","new_status"],
    "legal.dsar.closed": ["resolution"],
    "legal.deletion.created": ["requester_email_hash"],
    "legal.deletion.status_changed": ["old_status","new_status"],
    "legal.deletion.executed": ["tables_affected"]
  }'::jsonb;

  IF p_payload != '{}'::jsonb AND v_allowed_keys ? p_event_type THEN
    SELECT array_agg(k) INTO v_payload_keys FROM jsonb_object_keys(p_payload) AS k;
    IF v_payload_keys IS NOT NULL THEN
      SELECT array_agg(val::text) INTO v_event_allowed_keys
      FROM jsonb_array_elements_text(v_allowed_keys->p_event_type) AS val;
      IF v_event_allowed_keys IS NOT NULL THEN
        FOREACH v_key IN ARRAY v_payload_keys LOOP
          IF NOT (v_key = ANY(v_event_allowed_keys)) THEN
            RAISE EXCEPTION 'Disallowed payload key "%" for event_type "%"', v_key, p_event_type;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.data_event_ledger (
    tenant_id, zone, actor_user_id,
    event_type, direction, source,
    entity_type, entity_id, payload
  ) VALUES (
    p_tenant_id, p_zone, auth.uid(),
    p_event_type, p_direction, p_source,
    p_entity_type, p_entity_id, p_payload
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_data_event TO authenticated;
