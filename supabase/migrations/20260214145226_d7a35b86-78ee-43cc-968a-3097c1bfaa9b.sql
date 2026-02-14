
-- =====================================================================
-- ENTERPRISE HARDENING: Missing Indexes + View Security Fix
-- Quelle: check_missing_indexes() + Supabase Linter
-- =====================================================================

-- ===================== TEIL 1: tenant_id Indexes =====================

CREATE INDEX IF NOT EXISTS idx_social_topics_tenant ON public.social_topics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_inspiration_sources_tenant ON public.social_inspiration_sources (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_inspiration_samples_tenant ON public.social_inspiration_samples (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_inbound_items_tenant ON public.social_inbound_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_drafts_tenant ON public.social_drafts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_metrics_tenant ON public.social_metrics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_video_jobs_tenant ON public.social_video_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_assets_tenant ON public.social_assets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_mailboxes_tenant ON public.inbound_mailboxes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_attachments_tenant ON public.inbound_attachments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_property_assets_tenant ON public.applicant_property_assets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbox_sort_rules_tenant ON public.inbox_sort_rules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_submission_logs_tenant ON public.finance_submission_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbox_sort_containers_tenant ON public.inbox_sort_containers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_miety_homes_tenant ON public.miety_homes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_miety_contracts_tenant ON public.miety_contracts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_miety_meter_readings_tenant ON public.miety_meter_readings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_miety_eufy_accounts_tenant ON public.miety_eufy_accounts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_results_tenant ON public.research_results (tenant_id);
CREATE INDEX IF NOT EXISTS idx_consumer_loan_cases_tenant ON public.consumer_loan_cases (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_templates_tenant ON public.social_templates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_mandates_tenant ON public.social_mandates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_creatives_tenant ON public.social_creatives (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_tenant ON public.social_campaigns (tenant_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_tenant ON public.social_leads (tenant_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_tenant ON public.video_calls (tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_billing_log_tenant ON public.research_billing_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_website_pages_tenant ON public.website_pages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_website_sections_tenant ON public.website_sections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_website_versions_tenant ON public.website_versions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_msv_rent_payments_tenant ON public.msv_rent_payments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_msv_action_notes_tenant ON public.msv_action_notes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_msv_book_values_tenant ON public.msv_book_values (tenant_id);
CREATE INDEX IF NOT EXISTS idx_msv_bwa_entries_tenant ON public.msv_bwa_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_category_overrides_tenant ON public.analytics_category_overrides (tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_budget_settings_tenant ON public.analytics_budget_settings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_notes_tenant ON public.analytics_notes (tenant_id);

-- ===================== TEIL 2: FK-Spalten Indexes =====================

CREATE INDEX IF NOT EXISTS idx_social_inspiration_samples_source ON public.social_inspiration_samples (source_id);
CREATE INDEX IF NOT EXISTS idx_social_drafts_inbound_item ON public.social_drafts (inbound_item_id);
CREATE INDEX IF NOT EXISTS idx_social_drafts_topic ON public.social_drafts (topic_id);
CREATE INDEX IF NOT EXISTS idx_social_metrics_draft ON public.social_metrics (draft_id);
CREATE INDEX IF NOT EXISTS idx_social_video_jobs_draft ON public.social_video_jobs (draft_id);
CREATE INDEX IF NOT EXISTS idx_mail_campaigns_org ON public.mail_campaigns (org_id);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_mailbox ON public.inbound_emails (mailbox_id);
CREATE INDEX IF NOT EXISTS idx_inbound_attachments_document ON public.inbound_attachments (document_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_video_call ON public.calendar_events (video_call_id);
CREATE INDEX IF NOT EXISTS idx_mail_campaign_recipients_contact ON public.mail_campaign_recipients (contact_id);
CREATE INDEX IF NOT EXISTS idx_inbound_routing_rules_mandate ON public.inbound_routing_rules (mandate_id);
CREATE INDEX IF NOT EXISTS idx_inbound_routing_rules_target_tenant ON public.inbound_routing_rules (target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_inbound_items_mandate ON public.inbound_items (mandate_id);
CREATE INDEX IF NOT EXISTS idx_public_project_submissions_lead ON public.public_project_submissions (lead_id);
CREATE INDEX IF NOT EXISTS idx_organizations_storage_plan ON public.organizations (storage_plan_id);
CREATE INDEX IF NOT EXISTS idx_applicant_property_assets_profile ON public.applicant_property_assets (applicant_profile_id);
CREATE INDEX IF NOT EXISTS idx_video_call_invites_call ON public.video_call_invites (call_id);
CREATE INDEX IF NOT EXISTS idx_inbox_sort_rules_container ON public.inbox_sort_rules (container_id);
CREATE INDEX IF NOT EXISTS idx_commissions_contract_document ON public.commissions (contract_document_id);
CREATE INDEX IF NOT EXISTS idx_finance_submission_logs_bank_contact ON public.finance_submission_logs (bank_contact_id);
CREATE INDEX IF NOT EXISTS idx_finance_submission_logs_created_by ON public.finance_submission_logs (created_by);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_call ON public.video_call_participants (call_id);
CREATE INDEX IF NOT EXISTS idx_inbox_sort_containers_property ON public.inbox_sort_containers (property_id);
CREATE INDEX IF NOT EXISTS idx_miety_contracts_home ON public.miety_contracts (home_id);
CREATE INDEX IF NOT EXISTS idx_miety_meter_readings_home ON public.miety_meter_readings (home_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_attachments_storage_node ON public.whatsapp_attachments (storage_node_id);
CREATE INDEX IF NOT EXISTS idx_armstrong_command_events_user ON public.armstrong_command_events (user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created_by ON public.research_sessions (created_by);
CREATE INDEX IF NOT EXISTS idx_contact_candidates_imported_contact ON public.contact_candidates (imported_contact_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user ON public.credit_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_consumer_loan_cases_source_profile ON public.consumer_loan_cases (source_profile_id);
CREATE INDEX IF NOT EXISTS idx_social_creatives_mandate ON public.social_creatives (mandate_id);
CREATE INDEX IF NOT EXISTS idx_social_creatives_template ON public.social_creatives (template_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_campaign ON public.social_leads (campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_leads_mandate ON public.social_leads (mandate_id);
CREATE INDEX IF NOT EXISTS idx_social_lead_events_lead ON public.social_lead_events (lead_id);
CREATE INDEX IF NOT EXISTS idx_consumer_loan_documents_case ON public.consumer_loan_documents (case_id);
CREATE INDEX IF NOT EXISTS idx_research_orders_created_by ON public.research_orders (created_by);
CREATE INDEX IF NOT EXISTS idx_research_order_results_imported_contact ON public.research_order_results (imported_contact_id);
CREATE INDEX IF NOT EXISTS idx_tenant_websites_created_by ON public.tenant_websites (created_by);
CREATE INDEX IF NOT EXISTS idx_website_versions_published_by ON public.website_versions (published_by);

-- ============= TEIL 3: Composite Indexes (tenant_id, status) =============

CREATE INDEX IF NOT EXISTS idx_task_widgets_tenant_status ON public.task_widgets (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_inbound_items_tenant_status ON public.social_inbound_items (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_drafts_tenant_status ON public.social_drafts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_video_jobs_tenant_status ON public.social_video_jobs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_tenant_status ON public.lead_assignments (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_inbound_emails_tenant_status ON public.inbound_emails (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_postservice_mandates_tenant_status ON public.postservice_mandates (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_acq_outbound_messages_tenant_status ON public.acq_outbound_messages (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pv_connectors_tenant_status ON public.pv_connectors (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_acq_offers_tenant_status ON public.acq_offers (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_submission_logs_tenant_status ON public.finance_submission_logs (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_tenant_status ON public.whatsapp_accounts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_status ON public.whatsapp_messages (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_armstrong_command_events_tenant_status ON public.armstrong_command_events (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_tenant_status ON public.research_sessions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_candidates_tenant_status ON public.contact_candidates (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_consumer_loan_cases_tenant_status ON public.consumer_loan_cases (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_mandates_tenant_status ON public.social_mandates (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_creatives_tenant_status ON public.social_creatives (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_tenant_status ON public.social_campaigns (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_video_calls_tenant_status ON public.video_calls (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_research_orders_tenant_status ON public.research_orders (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_research_order_results_tenant_status ON public.research_order_results (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_websites_tenant_status ON public.tenant_websites (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_hosting_contracts_tenant_status ON public.hosting_contracts (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_msv_rent_payments_tenant_status ON public.msv_rent_payments (tenant_id, status);

-- ============= TEIL 4: View Security Fix =============

-- Fix v_public_knowledge: SECURITY DEFINER -> SECURITY INVOKER
CREATE OR REPLACE VIEW public.v_public_knowledge
WITH (security_invoker = on) AS
SELECT id, category, title, content, keywords, source
FROM knowledge_base
WHERE is_public = true;

-- Fix v_public_listings: SECURITY DEFINER -> SECURITY INVOKER
CREATE OR REPLACE VIEW public.v_public_listings
WITH (security_invoker = on) AS
SELECT
  l.public_id,
  l.title,
  l.description,
  l.asking_price,
  p.city,
  p.postal_code,
  p.property_type,
  p.total_area_sqm,
  p.year_built,
  p.annual_income,
  lp.published_at,
  lp.channel
FROM listings l
JOIN properties p ON l.property_id = p.id AND l.tenant_id = p.tenant_id
JOIN listing_publications lp ON l.id = lp.listing_id AND l.tenant_id = lp.tenant_id
WHERE l.status = 'active'
  AND lp.status = 'active'
  AND lp.channel = 'kaufy';
