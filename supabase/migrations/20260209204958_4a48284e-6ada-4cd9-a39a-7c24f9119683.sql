
-- =============================================================================
-- ENTERPRISE HARDENING MIGRATION (v2)
-- =============================================================================

-- =========================================================================
-- B4: ALL MISSING FK INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_tile_changelog_changed_by ON public.tile_changelog(changed_by);
CREATE INDEX IF NOT EXISTS idx_partner_verifications_partner_org_id ON public.partner_verifications(partner_org_id);
CREATE INDEX IF NOT EXISTS idx_partner_deals_contact_id ON public.partner_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_partner_deals_lead_id ON public.partner_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_listings_expose_document_id ON public.listings(expose_document_id);
CREATE INDEX IF NOT EXISTS idx_listings_sale_price_fixed_by ON public.listings(sale_price_fixed_by);
CREATE INDEX IF NOT EXISTS idx_listings_sales_mandate_consent_id ON public.listings(sales_mandate_consent_id);
CREATE INDEX IF NOT EXISTS idx_listings_property_id ON public.listings(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_partner_id ON public.leads(assigned_partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON public.leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_org_delegations_granted_by ON public.org_delegations(granted_by);
CREATE INDEX IF NOT EXISTS idx_org_delegations_revoked_by ON public.org_delegations(revoked_by);
CREATE INDEX IF NOT EXISTS idx_admin_email_templates_created_by ON public.admin_email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_email_sequences_created_by ON public.admin_email_sequences(created_by);
CREATE INDEX IF NOT EXISTS idx_property_features_activated_by ON public.property_features(activated_by);
CREATE INDEX IF NOT EXISTS idx_property_features_deactivated_by ON public.property_features(deactivated_by);
CREATE INDEX IF NOT EXISTS idx_renter_invites_created_by ON public.renter_invites(created_by);
CREATE INDEX IF NOT EXISTS idx_renter_invites_revoked_by ON public.renter_invites(revoked_by);
CREATE INDEX IF NOT EXISTS idx_renter_invites_contact_id ON public.renter_invites(contact_id);
CREATE INDEX IF NOT EXISTS idx_renter_invites_unit_id ON public.renter_invites(unit_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_granted_by ON public.access_grants(granted_by);
CREATE INDEX IF NOT EXISTS idx_access_grants_revoked_by ON public.access_grants(revoked_by);
CREATE INDEX IF NOT EXISTS idx_tenant_tile_activation_activated_by ON public.tenant_tile_activation(activated_by);
CREATE INDEX IF NOT EXISTS idx_tenant_tile_activation_deactivated_by ON public.tenant_tile_activation(deactivated_by);
CREATE INDEX IF NOT EXISTS idx_acq_mandates_split_terms_confirmed_by ON public.acq_mandates(split_terms_confirmed_by);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_by ON public.documents(deleted_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON public.invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_acq_mandate_events_actor_id ON public.acq_mandate_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_partner_pipelines_assigned_to ON public.partner_pipelines(assigned_to);
CREATE INDEX IF NOT EXISTS idx_partner_pipelines_contact_id ON public.partner_pipelines(contact_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agreement_consent_id ON public.commissions(agreement_consent_id);
CREATE INDEX IF NOT EXISTS idx_self_disclosures_submitted_by ON public.self_disclosures(submitted_by);
CREATE INDEX IF NOT EXISTS idx_finance_packages_data_sharing_consent_id ON public.finance_packages(data_sharing_consent_id);
CREATE INDEX IF NOT EXISTS idx_finance_packages_exported_by ON public.finance_packages(exported_by);
CREATE INDEX IF NOT EXISTS idx_msv_enrollments_property_id ON public.msv_enrollments(property_id);
CREATE INDEX IF NOT EXISTS idx_investment_searches_investment_profile_id ON public.investment_searches(investment_profile_id);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_provider_id ON public.scraper_jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_scraper_results_job_id ON public.scraper_results(job_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead_id ON public.lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_partner_org_id ON public.lead_assignments(partner_org_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_deal_id ON public.lead_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_pv_plant_id ON public.storage_nodes(pv_plant_id);
CREATE INDEX IF NOT EXISTS idx_interest_rates_created_by ON public.interest_rates(created_by);
CREATE INDEX IF NOT EXISTS idx_tax_parameters_created_by ON public.tax_parameters(created_by);
CREATE INDEX IF NOT EXISTS idx_letter_drafts_created_by ON public.letter_drafts(created_by);
CREATE INDEX IF NOT EXISTS idx_letter_drafts_recipient_contact_id ON public.letter_drafts(recipient_contact_id);
CREATE INDEX IF NOT EXISTS idx_context_property_assignment_assigned_by ON public.context_property_assignment(assigned_by);
CREATE INDEX IF NOT EXISTS idx_context_property_assignment_context_id ON public.context_property_assignment(context_id);
CREATE INDEX IF NOT EXISTS idx_property_valuations_consent_id ON public.property_valuations(consent_id);
CREATE INDEX IF NOT EXISTS idx_property_valuations_property_id ON public.property_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_property_valuations_report_document_id ON public.property_valuations(report_document_id);
CREATE INDEX IF NOT EXISTS idx_contact_staging_approved_by ON public.contact_staging(approved_by);
CREATE INDEX IF NOT EXISTS idx_contact_staging_merged_contact_id ON public.contact_staging(merged_contact_id);
CREATE INDEX IF NOT EXISTS idx_admin_outbound_emails_created_by ON public.admin_outbound_emails(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_saved_segments_created_by ON public.admin_saved_segments(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_research_jobs_created_by ON public.admin_research_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_contact_tags_created_by ON public.admin_contact_tags(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_jobs_triggered_by ON public.audit_jobs(triggered_by);
CREATE INDEX IF NOT EXISTS idx_audit_jobs_audit_report_id ON public.audit_jobs(audit_report_id);
CREATE INDEX IF NOT EXISTS idx_armstrong_action_overrides_updated_by ON public.armstrong_action_overrides(updated_by);
CREATE INDEX IF NOT EXISTS idx_armstrong_knowledge_items_created_by ON public.armstrong_knowledge_items(created_by);
CREATE INDEX IF NOT EXISTS idx_armstrong_knowledge_items_reviewed_by ON public.armstrong_knowledge_items(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_armstrong_policies_created_by ON public.armstrong_policies(created_by);
CREATE INDEX IF NOT EXISTS idx_armstrong_policies_approved_by ON public.armstrong_policies(approved_by);

-- =========================================================================
-- B2: SET search_path ON FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.generate_acq_mandate_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'ACQ-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_acq_routing_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.routing_token IS NULL THEN
    NEW.routing_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_contact_dedupe_key()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dedupe_key := LOWER(TRIM(COALESCE(NEW.email, ''))) || '|' || LOWER(TRIM(COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_applicant_liabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================================
-- B1: Armstrong Views → SECURITY INVOKER
-- =========================================================================
ALTER VIEW IF EXISTS public.v_armstrong_costs_daily SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_armstrong_dashboard_kpis SET (security_invoker = on);

-- =========================================================================
-- B3: Harden RLS Policies
-- =========================================================================
DROP POLICY IF EXISTS "Admins can manage knowledge base" ON public.knowledge_base;
CREATE POLICY "Admins can manage knowledge base"
  ON public.knowledge_base
  FOR ALL
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Allow insert for tracking" ON public.listing_views;
CREATE POLICY "Allow insert for tracking"
  ON public.listing_views
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================================================
-- A3: self_disclosures public_id (Prefix SD)
-- =========================================================================
ALTER TABLE public.self_disclosures ADD COLUMN IF NOT EXISTS public_id TEXT;

CREATE OR REPLACE FUNCTION public.generate_self_disclosure_public_id()
RETURNS TRIGGER AS $$
DECLARE
  raw_bytes BYTEA;
  base32_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  byte_val INT;
BEGIN
  IF NEW.public_id IS NULL THEN
    raw_bytes := gen_random_bytes(5);
    FOR i IN 0..7 LOOP
      byte_val := get_byte(raw_bytes, i % 5);
      result := result || substr(base32_chars, (byte_val % 32) + 1, 1);
    END LOOP;
    NEW.public_id := 'SOT-SD-' || result;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_self_disclosure_public_id ON public.self_disclosures;
CREATE TRIGGER trg_self_disclosure_public_id
  BEFORE INSERT ON public.self_disclosures
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_self_disclosure_public_id();

-- Backfill existing rows
DO $$
DECLARE
  rec RECORD;
  raw_bytes BYTEA;
  base32_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT;
  i INT;
  byte_val INT;
BEGIN
  FOR rec IN SELECT id FROM public.self_disclosures WHERE public_id IS NULL LOOP
    raw_bytes := gen_random_bytes(5);
    result := '';
    FOR i IN 0..7 LOOP
      byte_val := get_byte(raw_bytes, i % 5);
      result := result || substr(base32_chars, (byte_val % 32) + 1, 1);
    END LOOP;
    UPDATE public.self_disclosures SET public_id = 'SOT-SD-' || result WHERE id = rec.id;
  END LOOP;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_self_disclosures_public_id ON public.self_disclosures(public_id);

-- =========================================================================
-- C3: GDPR deleted_at on 3 existing PII tables
-- (communication_events does not exist — skipped)
-- =========================================================================
ALTER TABLE public.renter_invites ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.partner_deals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.finance_bank_contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_renter_invites_deleted_at ON public.renter_invites(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_deals_deleted_at ON public.partner_deals(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_finance_bank_contacts_deleted_at ON public.finance_bank_contacts(deleted_at) WHERE deleted_at IS NOT NULL;
