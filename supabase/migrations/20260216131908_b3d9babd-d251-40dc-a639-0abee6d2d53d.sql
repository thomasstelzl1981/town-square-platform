-- Phase B: tenant_id NOT NULL Härtung für 15 Tabellen
-- Alle haben 0 NULL-Werte (der einzige NULL in data_event_ledger wurde gelöscht)

ALTER TABLE public.acq_inbound_messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.acq_mandate_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.acq_offer_activities ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.acq_offer_documents ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.acq_offers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.acq_outbound_messages ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.cars_offers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.data_event_ledger ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.finance_submission_logs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.lead_assignments ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pv_connectors ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.pv_measurements ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.test_data_registry ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_consents ALTER COLUMN tenant_id SET NOT NULL;