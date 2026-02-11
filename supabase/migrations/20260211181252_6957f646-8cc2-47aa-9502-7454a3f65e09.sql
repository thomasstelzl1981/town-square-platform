
-- ============================================================================
-- STORAGE HARDENING Step 6+7: Denormalize tenant_id into 9 child tables
-- ============================================================================

-- STEP 6: Acquiary child tables
ALTER TABLE public.acq_offers ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.acq_offers o SET tenant_id = m.tenant_id FROM public.acq_mandates m WHERE o.mandate_id = m.id;

ALTER TABLE public.acq_offer_activities ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.acq_offer_activities oa SET tenant_id = o.tenant_id FROM public.acq_offers o WHERE oa.offer_id = o.id;

ALTER TABLE public.acq_offer_documents ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.acq_offer_documents od SET tenant_id = o.tenant_id FROM public.acq_offers o WHERE od.offer_id = o.id;

ALTER TABLE public.acq_inbound_messages ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.acq_inbound_messages im SET tenant_id = m.tenant_id FROM public.acq_mandates m WHERE im.mandate_id = m.id;

ALTER TABLE public.acq_outbound_messages ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.acq_outbound_messages om SET tenant_id = m.tenant_id FROM public.acq_mandates m WHERE om.mandate_id = m.id;

ALTER TABLE public.acq_mandate_events ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.acq_mandate_events me SET tenant_id = m.tenant_id FROM public.acq_mandates m WHERE me.mandate_id = m.id;

-- STEP 7: PV children + lead_assignments (column is pv_plant_id, not plant_id)
ALTER TABLE public.pv_connectors ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.pv_connectors c SET tenant_id = p.tenant_id FROM public.pv_plants p WHERE c.pv_plant_id = p.id;

ALTER TABLE public.pv_measurements ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.pv_measurements ms SET tenant_id = p.tenant_id FROM public.pv_plants p WHERE ms.pv_plant_id = p.id;

ALTER TABLE public.lead_assignments ADD COLUMN tenant_id UUID REFERENCES public.organizations(id);
UPDATE public.lead_assignments la SET tenant_id = l.tenant_id FROM public.leads l WHERE la.lead_id = l.id;

-- INDEXES
CREATE INDEX idx_acq_offers_tenant_id ON public.acq_offers(tenant_id);
CREATE INDEX idx_acq_offer_activities_tenant_id ON public.acq_offer_activities(tenant_id);
CREATE INDEX idx_acq_offer_documents_tenant_id ON public.acq_offer_documents(tenant_id);
CREATE INDEX idx_acq_inbound_messages_tenant_id ON public.acq_inbound_messages(tenant_id);
CREATE INDEX idx_acq_outbound_messages_tenant_id ON public.acq_outbound_messages(tenant_id);
CREATE INDEX idx_acq_mandate_events_tenant_id ON public.acq_mandate_events(tenant_id);
CREATE INDEX idx_pv_connectors_tenant_id ON public.pv_connectors(tenant_id);
CREATE INDEX idx_pv_measurements_tenant_id ON public.pv_measurements(tenant_id);
CREATE INDEX idx_lead_assignments_tenant_id ON public.lead_assignments(tenant_id);

-- AUTO-FILL TRIGGERS
CREATE OR REPLACE FUNCTION public.set_tenant_id_from_mandate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.mandate_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.acq_mandates WHERE id = NEW.mandate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_offer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.offer_id IS NOT NULL THEN
    SELECT m.tenant_id INTO NEW.tenant_id 
    FROM public.acq_offers o JOIN public.acq_mandates m ON o.mandate_id = m.id 
    WHERE o.id = NEW.offer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_pv_plant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.pv_plant_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.pv_plants WHERE id = NEW.pv_plant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_tenant_id_from_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL AND NEW.lead_id IS NOT NULL THEN
    SELECT tenant_id INTO NEW.tenant_id FROM public.leads WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers
CREATE TRIGGER trg_acq_offers_set_tenant BEFORE INSERT ON public.acq_offers FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_mandate();
CREATE TRIGGER trg_acq_inbound_set_tenant BEFORE INSERT ON public.acq_inbound_messages FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_mandate();
CREATE TRIGGER trg_acq_outbound_set_tenant BEFORE INSERT ON public.acq_outbound_messages FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_mandate();
CREATE TRIGGER trg_acq_mandate_events_set_tenant BEFORE INSERT ON public.acq_mandate_events FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_mandate();
CREATE TRIGGER trg_acq_offer_activities_set_tenant BEFORE INSERT ON public.acq_offer_activities FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_offer();
CREATE TRIGGER trg_acq_offer_documents_set_tenant BEFORE INSERT ON public.acq_offer_documents FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_offer();
CREATE TRIGGER trg_pv_connectors_set_tenant BEFORE INSERT ON public.pv_connectors FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_pv_plant();
CREATE TRIGGER trg_pv_measurements_set_tenant BEFORE INSERT ON public.pv_measurements FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_pv_plant();
CREATE TRIGGER trg_lead_assignments_set_tenant BEFORE INSERT ON public.lead_assignments FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_lead();
