
-- =============================================================
-- FK CASCADE CLEANUP — Owned children get CASCADE, references get SET NULL
-- =============================================================

-- ─── PROPERTIES → Owned children: CASCADE ───────────────────
ALTER TABLE public.listings DROP CONSTRAINT listings_tenant_property_fk;
ALTER TABLE public.listings ADD CONSTRAINT listings_tenant_property_fk
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.property_accounting DROP CONSTRAINT property_accounting_property_id_fkey;
ALTER TABLE public.property_accounting ADD CONSTRAINT property_accounting_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.partner_pipelines DROP CONSTRAINT partner_pipelines_property_id_fkey;
ALTER TABLE public.partner_pipelines ADD CONSTRAINT partner_pipelines_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.finance_packages DROP CONSTRAINT finance_packages_property_id_fkey;
ALTER TABLE public.finance_packages ADD CONSTRAINT finance_packages_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.msv_enrollments DROP CONSTRAINT me_tenant_property_fk;
ALTER TABLE public.msv_enrollments ADD CONSTRAINT me_tenant_property_fk
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.rental_listings DROP CONSTRAINT rental_listings_tenant_property_fk;
ALTER TABLE public.rental_listings ADD CONSTRAINT rental_listings_tenant_property_fk
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.dev_project_units DROP CONSTRAINT dev_project_units_property_id_fkey;
ALTER TABLE public.dev_project_units ADD CONSTRAINT dev_project_units_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.calendar_events DROP CONSTRAINT calendar_events_property_id_fkey;
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.nk_beleg_extractions DROP CONSTRAINT nk_beleg_extractions_property_id_fkey;
ALTER TABLE public.nk_beleg_extractions ADD CONSTRAINT nk_beleg_extractions_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.nk_tenant_settlements DROP CONSTRAINT nk_tenant_settlements_property_id_fkey;
ALTER TABLE public.nk_tenant_settlements ADD CONSTRAINT nk_tenant_settlements_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- ─── LISTINGS → Owned children: CASCADE ─────────────────────
ALTER TABLE public.listing_publications DROP CONSTRAINT listing_pub_tenant_listing_fk;
ALTER TABLE public.listing_publications ADD CONSTRAINT listing_pub_tenant_listing_fk
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.listing_activities DROP CONSTRAINT listing_act_tenant_listing_fk;
ALTER TABLE public.listing_activities ADD CONSTRAINT listing_act_tenant_listing_fk
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.listing_inquiries DROP CONSTRAINT listing_inq_tenant_listing_fk;
ALTER TABLE public.listing_inquiries ADD CONSTRAINT listing_inq_tenant_listing_fk
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.listing_partner_terms DROP CONSTRAINT listing_terms_tenant_listing_fk;
ALTER TABLE public.listing_partner_terms ADD CONSTRAINT listing_terms_tenant_listing_fk
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.reservations DROP CONSTRAINT reserv_tenant_listing_fk;
ALTER TABLE public.reservations ADD CONSTRAINT reserv_tenant_listing_fk
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

ALTER TABLE public.sale_transactions DROP CONSTRAINT trans_tenant_listing_fk;
ALTER TABLE public.sale_transactions ADD CONSTRAINT trans_tenant_listing_fk
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- ─── LEASES → Owned children: CASCADE ───────────────────────
ALTER TABLE public.rent_payments DROP CONSTRAINT rp_tenant_lease_fk;
ALTER TABLE public.rent_payments ADD CONSTRAINT rp_tenant_lease_fk
  FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;

ALTER TABLE public.rent_reminders DROP CONSTRAINT rr_tenant_lease_fk;
ALTER TABLE public.rent_reminders ADD CONSTRAINT rr_tenant_lease_fk
  FOREIGN KEY (lease_id) REFERENCES public.leases(id) ON DELETE CASCADE;

-- ─── CONTACTS → References: SET NULL ────────────────────────
ALTER TABLE public.leads DROP CONSTRAINT leads_contact_id_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.calendar_events DROP CONSTRAINT calendar_events_contact_id_fkey;
ALTER TABLE public.calendar_events ADD CONSTRAINT calendar_events_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.commissions DROP CONSTRAINT commissions_contact_id_fkey;
ALTER TABLE public.commissions ADD CONSTRAINT commissions_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.contact_candidates DROP CONSTRAINT contact_candidates_imported_contact_id_fkey;
ALTER TABLE public.contact_candidates ADD CONSTRAINT contact_candidates_imported_contact_id_fkey
  FOREIGN KEY (imported_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.contact_conversations DROP CONSTRAINT contact_conversations_contact_id_fkey;
ALTER TABLE public.contact_conversations ADD CONSTRAINT contact_conversations_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.contact_staging DROP CONSTRAINT contact_staging_merged_contact_id_fkey;
ALTER TABLE public.contact_staging ADD CONSTRAINT contact_staging_merged_contact_id_fkey
  FOREIGN KEY (merged_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.dev_project_reservations DROP CONSTRAINT dev_project_reservations_buyer_contact_id_fkey;
ALTER TABLE public.dev_project_reservations ADD CONSTRAINT dev_project_reservations_buyer_contact_id_fkey
  FOREIGN KEY (buyer_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.finance_packages DROP CONSTRAINT finance_packages_contact_id_fkey;
ALTER TABLE public.finance_packages ADD CONSTRAINT finance_packages_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.investment_profiles DROP CONSTRAINT investment_profiles_contact_id_fkey;
ALTER TABLE public.investment_profiles ADD CONSTRAINT investment_profiles_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.listing_inquiries DROP CONSTRAINT listing_inquiries_contact_id_fkey;
ALTER TABLE public.listing_inquiries ADD CONSTRAINT listing_inquiries_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.nk_tenant_settlements DROP CONSTRAINT nk_tenant_settlements_renter_contact_id_fkey;
ALTER TABLE public.nk_tenant_settlements ADD CONSTRAINT nk_tenant_settlements_renter_contact_id_fkey
  FOREIGN KEY (renter_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.partner_deals DROP CONSTRAINT partner_deals_contact_id_fkey;
ALTER TABLE public.partner_deals ADD CONSTRAINT partner_deals_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.partner_pipelines DROP CONSTRAINT partner_pipelines_contact_id_fkey;
ALTER TABLE public.partner_pipelines ADD CONSTRAINT partner_pipelines_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.research_order_results DROP CONSTRAINT research_order_results_imported_contact_id_fkey;
ALTER TABLE public.research_order_results ADD CONSTRAINT research_order_results_imported_contact_id_fkey
  FOREIGN KEY (imported_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.reservations DROP CONSTRAINT reservations_buyer_contact_id_fkey;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_buyer_contact_id_fkey
  FOREIGN KEY (buyer_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.sale_transactions DROP CONSTRAINT sale_transactions_buyer_contact_id_fkey;
ALTER TABLE public.sale_transactions ADD CONSTRAINT sale_transactions_buyer_contact_id_fkey
  FOREIGN KEY (buyer_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.service_case_offers DROP CONSTRAINT service_case_offers_contact_id_fkey;
ALTER TABLE public.service_case_offers ADD CONSTRAINT service_case_offers_contact_id_fkey
  FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.service_case_outbound DROP CONSTRAINT service_case_outbound_recipient_contact_id_fkey;
ALTER TABLE public.service_case_outbound ADD CONSTRAINT service_case_outbound_recipient_contact_id_fkey
  FOREIGN KEY (recipient_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.service_cases DROP CONSTRAINT service_cases_awarded_to_contact_id_fkey;
ALTER TABLE public.service_cases ADD CONSTRAINT service_cases_awarded_to_contact_id_fkey
  FOREIGN KEY (awarded_to_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.letter_drafts DROP CONSTRAINT letter_drafts_recipient_contact_id_fkey;
ALTER TABLE public.letter_drafts ADD CONSTRAINT letter_drafts_recipient_contact_id_fkey
  FOREIGN KEY (recipient_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.acq_offers DROP CONSTRAINT acq_offers_source_contact_id_fkey;
ALTER TABLE public.acq_offers ADD CONSTRAINT acq_offers_source_contact_id_fkey
  FOREIGN KEY (source_contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;

-- ─── MSV_BANK_ACCOUNTS → SET NULL on lease reference ────────
ALTER TABLE public.leases DROP CONSTRAINT leases_linked_bank_account_id_fkey;
ALTER TABLE public.leases ADD CONSTRAINT leases_linked_bank_account_id_fkey
  FOREIGN KEY (linked_bank_account_id) REFERENCES public.msv_bank_accounts(id) ON DELETE SET NULL;
