
-- =====================================================
-- Enterprise Hardening v3: Indexes, Views, Functions
-- =====================================================

-- PART 1: Recreate Armstrong Views as SECURITY INVOKER
-- =====================================================

DROP VIEW IF EXISTS public.v_armstrong_costs_daily;
CREATE VIEW public.v_armstrong_costs_daily AS
SELECT action_code,
    date(created_at) AS date,
    org_id,
    count(*) AS run_count,
    sum(cost_cents) AS total_cost_cents,
    sum(tokens_used) AS total_tokens,
    (avg(duration_ms))::integer AS avg_duration_ms,
    count(*) FILTER (WHERE (status = 'failed'::text)) AS failure_count
   FROM armstrong_action_runs
  GROUP BY action_code, (date(created_at)), org_id;

DROP VIEW IF EXISTS public.v_armstrong_dashboard_kpis;
CREATE VIEW public.v_armstrong_dashboard_kpis AS
SELECT count(*) FILTER (WHERE (created_at > (now() - '24:00:00'::interval))) AS actions_24h,
    COALESCE(sum(cost_cents) FILTER (WHERE (created_at > (now() - '30 days'::interval))), (0)::bigint) AS costs_30d_cents,
    COALESCE(((((count(*) FILTER (WHERE ((status = 'failed'::text) AND (created_at > (now() - '7 days'::interval)))))::double precision / (NULLIF(count(*) FILTER (WHERE (created_at > (now() - '7 days'::interval))), 0))::double precision) * (100)::double precision))::numeric(5,2), (0)::numeric) AS error_rate_7d,
    COALESCE((avg(duration_ms) FILTER (WHERE (created_at > (now() - '24:00:00'::interval))))::integer, 0) AS avg_response_ms_24h,
    ( SELECT count(*) AS count
           FROM armstrong_knowledge_items
          WHERE (armstrong_knowledge_items.status = 'published'::text)) AS knowledge_items_count,
    ( SELECT count(*) AS count
           FROM armstrong_policies
          WHERE (armstrong_policies.status = 'active'::text)) AS active_policies_count
   FROM armstrong_action_runs;

-- PART 2: Fix 8 Functions with search_path
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_claim_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.public_id := 'CLM-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_property_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  year_str TEXT;
  seq_num INTEGER;
  new_code TEXT;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    SELECT COALESCE(MAX(
      NULLIF(REGEXP_REPLACE(code, '^IMM-' || year_str || '-', ''), code)::INTEGER
    ), 0) + 1
    INTO seq_num
    FROM properties 
    WHERE tenant_id = NEW.tenant_id 
      AND code LIKE 'IMM-' || year_str || '-%';
    new_code := 'IMM-' || year_str || '-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.code := new_code;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_vehicle_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.public_id := 'VEH-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_applicant_profiles_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('AP');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_dev_project_units_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('BE');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_dev_projects_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('BT');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_leases_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('MV');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_pv_plants_public_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('PV');
  END IF;
  RETURN NEW;
END;
$function$;

-- PART 3: 67 Missing FK Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_acq_analysis_runs_contact_staging_id ON public.acq_analysis_runs (contact_staging_id);
CREATE INDEX IF NOT EXISTS idx_acq_inbound_messages_in_reply_to_message_id ON public.acq_inbound_messages (in_reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_acq_inbound_messages_routed_by ON public.acq_inbound_messages (routed_by);
CREATE INDEX IF NOT EXISTS idx_acq_offer_activities_created_by ON public.acq_offer_activities (created_by);
CREATE INDEX IF NOT EXISTS idx_acq_offers_data_room_folder_id ON public.acq_offers (data_room_folder_id);
CREATE INDEX IF NOT EXISTS idx_acq_offers_source_inbound_id ON public.acq_offers (source_inbound_id);
CREATE INDEX IF NOT EXISTS idx_admin_email_sequence_steps_template_id ON public.admin_email_sequence_steps (template_id);
CREATE INDEX IF NOT EXISTS idx_admin_outbound_emails_enrollment_id ON public.admin_outbound_emails (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_admin_outbound_emails_sequence_step_id ON public.admin_outbound_emails (sequence_step_id);
CREATE INDEX IF NOT EXISTS idx_applicant_profiles_linked_primary_profile_id ON public.applicant_profiles (linked_primary_profile_id);
CREATE INDEX IF NOT EXISTS idx_armstrong_action_runs_user_id ON public.armstrong_action_runs (user_id);
CREATE INDEX IF NOT EXISTS idx_armstrong_billing_events_action_run_id ON public.armstrong_billing_events (action_run_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_created_by ON public.audit_reports (created_by);
CREATE INDEX IF NOT EXISTS idx_cars_vehicles_created_by ON public.cars_vehicles (created_by);
CREATE INDEX IF NOT EXISTS idx_case_events_actor_user_id ON public.case_events (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_by ON public.cases (created_by);
CREATE INDEX IF NOT EXISTS idx_customer_projects_created_by ON public.customer_projects (created_by);
CREATE INDEX IF NOT EXISTS idx_customer_projects_investment_profile_id ON public.customer_projects (investment_profile_id);
CREATE INDEX IF NOT EXISTS idx_dev_project_documents_created_by ON public.dev_project_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_dev_project_reservations_created_by ON public.dev_project_reservations (created_by);
CREATE INDEX IF NOT EXISTS idx_dev_project_reservations_partner_user_id ON public.dev_project_reservations (partner_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_projects_created_by ON public.dev_projects (created_by);
CREATE INDEX IF NOT EXISTS idx_listing_activities_performed_by ON public.listing_activities (performed_by);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_qualified_by ON public.listing_inquiries (qualified_by);
CREATE INDEX IF NOT EXISTS idx_listing_partner_terms_partner_release_consent_id ON public.listing_partner_terms (partner_release_consent_id);
CREATE INDEX IF NOT EXISTS idx_listing_partner_terms_system_fee_consent_id ON public.listing_partner_terms (system_fee_consent_id);
CREATE INDEX IF NOT EXISTS idx_loans_unit_id ON public.loans (unit_id);
CREATE INDEX IF NOT EXISTS idx_msv_readiness_items_enrollment_id ON public.msv_readiness_items (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_org_links_created_by ON public.org_links (created_by);
CREATE INDEX IF NOT EXISTS idx_org_policies_created_by ON public.org_policies (created_by);
CREATE INDEX IF NOT EXISTS idx_postings_unit_id ON public.postings (unit_id);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_context_id ON public.properties (landlord_context_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner_context_id ON public.properties (owner_context_id);
CREATE INDEX IF NOT EXISTS idx_properties_public_listing_approved_by ON public.properties (public_listing_approved_by);
CREATE INDEX IF NOT EXISTS idx_pv_connectors_pv_plant_id ON public.pv_connectors (pv_plant_id);
CREATE INDEX IF NOT EXISTS idx_pv_plants_owner_org_id ON public.pv_plants (owner_org_id);
CREATE INDEX IF NOT EXISTS idx_pv_plants_owner_user_id ON public.pv_plants (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_rent_payments_lease_id ON public.rent_payments (lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_reminders_confirmed_by ON public.rent_reminders (confirmed_by);
CREATE INDEX IF NOT EXISTS idx_rent_reminders_document_id ON public.rent_reminders (document_id);
CREATE INDEX IF NOT EXISTS idx_rent_reminders_lease_id ON public.rent_reminders (lease_id);
CREATE INDEX IF NOT EXISTS idx_rent_reminders_payment_id ON public.rent_reminders (payment_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_created_by ON public.rental_listings (created_by);
CREATE INDEX IF NOT EXISTS idx_rental_listings_expose_document_id ON public.rental_listings (expose_document_id);
CREATE INDEX IF NOT EXISTS idx_rental_listings_unit_id ON public.rental_listings (unit_id);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer_contact_id ON public.reservations (buyer_contact_id);
CREATE INDEX IF NOT EXISTS idx_reservations_inquiry_id ON public.reservations (inquiry_id);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_buyer_contact_id ON public.sale_transactions (buyer_contact_id);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_commission_approved_by ON public.sale_transactions (commission_approved_by);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_reservation_id ON public.sale_transactions (reservation_id);
CREATE INDEX IF NOT EXISTS idx_service_case_inbound_processed_by ON public.service_case_inbound (processed_by);
CREATE INDEX IF NOT EXISTS idx_service_case_offers_contact_id ON public.service_case_offers (contact_id);
CREATE INDEX IF NOT EXISTS idx_service_case_offers_document_id ON public.service_case_offers (document_id);
CREATE INDEX IF NOT EXISTS idx_service_case_offers_reviewed_by ON public.service_case_offers (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_service_case_offers_service_case_id ON public.service_case_offers (service_case_id);
CREATE INDEX IF NOT EXISTS idx_service_case_outbound_confirmed_by ON public.service_case_outbound (confirmed_by);
CREATE INDEX IF NOT EXISTS idx_service_case_outbound_recipient_contact_id ON public.service_case_outbound (recipient_contact_id);
CREATE INDEX IF NOT EXISTS idx_service_case_outbound_sent_by ON public.service_case_outbound (sent_by);
CREATE INDEX IF NOT EXISTS idx_service_case_outbound_service_case_id ON public.service_case_outbound (service_case_id);
CREATE INDEX IF NOT EXISTS idx_service_case_providers_response_inbound_id ON public.service_case_providers (response_inbound_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_awarded_to_contact_id ON public.service_cases (awarded_to_contact_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_created_by ON public.service_cases (created_by);
CREATE INDEX IF NOT EXISTS idx_service_cases_dms_folder_id ON public.service_cases (dms_folder_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_external_lv_document_id ON public.service_cases (external_lv_document_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_property_id ON public.service_cases (property_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_unit_id ON public.service_cases (unit_id);
CREATE INDEX IF NOT EXISTS idx_test_data_registry_imported_by ON public.test_data_registry (imported_by);
CREATE INDEX IF NOT EXISTS idx_valuation_credits_invoice_id ON public.valuation_credits (invoice_id);
