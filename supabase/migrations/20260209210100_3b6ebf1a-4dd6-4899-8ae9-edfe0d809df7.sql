
-- =====================================================
-- Enterprise Hardening v3: Definitiver Fix-Plan
-- DB-01: 48 Composite-Indizes (tenant_id, status)
-- DB-02: 2 Armstrong Views -> SECURITY INVOKER
-- =====================================================

-- =====================================================
-- BLOCK 1: 48 Composite-Indizes (tenant_id, status)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_access_grants_tenant_status ON public.access_grants(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_acq_mandates_tenant_status ON public.acq_mandates(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_tenant_status ON public.ad_campaigns(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_claims_tenant_status ON public.cars_claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_financing_tenant_status ON public.cars_financing(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_insurances_tenant_status ON public.cars_insurances(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_logbook_connections_tenant_status ON public.cars_logbook_connections(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cars_vehicles_tenant_status ON public.cars_vehicles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_tenant_status ON public.cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_status ON public.commissions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_staging_tenant_status ON public.contact_staging(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_projects_tenant_status ON public.customer_projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dev_project_reservations_tenant_status ON public.dev_project_reservations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dev_project_units_tenant_status ON public.dev_project_units(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_extractions_tenant_status ON public.extractions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_cases_tenant_status ON public.finance_cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_mandates_tenant_status ON public.finance_mandates(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_packages_tenant_status ON public.finance_packages(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_requests_tenant_status ON public.finance_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_integration_registry_tenant_status ON public.integration_registry(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_investment_favorites_tenant_status ON public.investment_favorites(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON public.invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_letter_drafts_tenant_status ON public.letter_drafts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_tenant_status ON public.listing_inquiries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_listing_publications_tenant_status ON public.listing_publications(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_msv_bank_accounts_tenant_status ON public.msv_bank_accounts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_msv_enrollments_tenant_status ON public.msv_enrollments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_msv_readiness_items_tenant_status ON public.msv_readiness_items(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_nk_periods_tenant_status ON public.nk_periods(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_postings_tenant_status ON public.postings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_status ON public.properties(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_property_features_tenant_status ON public.property_features(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_property_valuations_tenant_status ON public.property_valuations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pv_plants_tenant_status ON public.pv_plants(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rent_payments_tenant_status ON public.rent_payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rent_reminders_tenant_status ON public.rent_reminders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_listings_tenant_status ON public.rental_listings(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_rental_publications_tenant_status ON public.rental_publications(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_renter_invites_tenant_status ON public.renter_invites(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant_status ON public.reservations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_tenant_status ON public.sale_transactions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_tenant_status ON public.scraper_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_service_case_inbound_tenant_status ON public.service_case_inbound(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_service_case_offers_tenant_status ON public.service_case_offers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_service_case_outbound_tenant_status ON public.service_case_outbound(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON public.subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_tile_activation_tenant_status ON public.tenant_tile_activation(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_user_consents_tenant_status ON public.user_consents(tenant_id, status);

-- =====================================================
-- BLOCK 2: Armstrong Views -> SECURITY INVOKER
-- =====================================================

DROP VIEW IF EXISTS v_armstrong_costs_daily;
CREATE VIEW v_armstrong_costs_daily
  WITH (security_invoker = on)
  AS
  SELECT action_code,
    date(created_at) AS date,
    org_id,
    count(*) AS run_count,
    sum(cost_cents) AS total_cost_cents,
    sum(tokens_used) AS total_tokens,
    avg(duration_ms)::integer AS avg_duration_ms,
    count(*) FILTER (WHERE status = 'failed'::text) AS failure_count
   FROM armstrong_action_runs
  GROUP BY action_code, (date(created_at)), org_id;

DROP VIEW IF EXISTS v_armstrong_dashboard_kpis;
CREATE VIEW v_armstrong_dashboard_kpis
  WITH (security_invoker = on)
  AS
  SELECT count(*) FILTER (WHERE created_at > (now() - '24:00:00'::interval)) AS actions_24h,
    COALESCE(sum(cost_cents) FILTER (WHERE created_at > (now() - '30 days'::interval)), 0::bigint) AS costs_30d_cents,
    COALESCE((count(*) FILTER (WHERE status = 'failed'::text AND created_at > (now() - '7 days'::interval))::double precision / NULLIF(count(*) FILTER (WHERE created_at > (now() - '7 days'::interval)), 0)::double precision * 100::double precision)::numeric(5,2), 0::numeric) AS error_rate_7d,
    COALESCE(avg(duration_ms) FILTER (WHERE created_at > (now() - '24:00:00'::interval))::integer, 0) AS avg_response_ms_24h,
    ( SELECT count(*) AS count
           FROM armstrong_knowledge_items
          WHERE armstrong_knowledge_items.status = 'published'::text) AS knowledge_items_count,
    ( SELECT count(*) AS count
           FROM armstrong_policies
          WHERE armstrong_policies.status = 'active'::text) AS active_policies_count
   FROM armstrong_action_runs;

-- =====================================================
-- BLOCK 3: Bewusst beibehaltene DEFINER-Views
-- v_public_listings und v_public_knowledge bleiben
-- SECURITY DEFINER, da sie oeffentliche Daten fuer
-- unauthentifizierte Zone-3-Besucher bereitstellen.
-- =====================================================
