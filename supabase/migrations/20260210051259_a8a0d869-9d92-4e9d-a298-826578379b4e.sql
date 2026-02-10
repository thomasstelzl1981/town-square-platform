
-- =============================================
-- PHASE 2: Social Media Datenmodell
-- 6 Tabellen + RLS + Seeds
-- =============================================

-- 1) social_templates — Kaufy CI Templates
CREATE TABLE public.social_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  format_type TEXT NOT NULL DEFAULT 'slideshow_4' CHECK (format_type IN ('slideshow_4','single','story','carousel')),
  editable_fields_schema JSONB DEFAULT '{}',
  ci_rules JSONB DEFAULT '{}',
  preview_document_id UUID,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_templates_select" ON public.social_templates FOR SELECT USING (true);
CREATE POLICY "social_templates_admin" ON public.social_templates FOR ALL USING (public.is_platform_admin());

-- 2) social_mandates — Partner-Aufträge
CREATE TABLE public.social_mandates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  partner_user_id UUID NOT NULL,
  partner_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','review','approved','scheduled','live','paused','ended','failed')),
  budget_total_cents INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  regions JSONB DEFAULT '[]',
  audience_preset JSONB DEFAULT '{}',
  template_slots JSONB DEFAULT '{}',
  personalization JSONB DEFAULT '{}',
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','partial')),
  payment_ref JSONB DEFAULT '{}',
  publishing_meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_mandates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_mandates_tenant" ON public.social_mandates FOR SELECT USING (tenant_id = (SELECT public.get_user_tenant_id()));
CREATE POLICY "social_mandates_partner_insert" ON public.social_mandates FOR INSERT WITH CHECK (partner_user_id = auth.uid());
CREATE POLICY "social_mandates_partner_select" ON public.social_mandates FOR SELECT USING (partner_user_id = auth.uid());
CREATE POLICY "social_mandates_admin" ON public.social_mandates FOR ALL USING (public.is_platform_admin());

-- 3) social_creatives — Generierte Outputs
CREATE TABLE public.social_creatives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  mandate_id UUID REFERENCES public.social_mandates(id),
  campaign_id UUID,
  template_id UUID REFERENCES public.social_templates(id),
  slot_key TEXT CHECK (slot_key IN ('T1','T2','T3','T4','T5')),
  slideshow_outline JSONB DEFAULT '[]',
  caption_text TEXT,
  cta_variant TEXT,
  assets_document_ids UUID[] DEFAULT '{}',
  rendered_document_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generated','approved','published','archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_creatives_tenant" ON public.social_creatives FOR SELECT USING (tenant_id = (SELECT public.get_user_tenant_id()));
CREATE POLICY "social_creatives_admin" ON public.social_creatives FOR ALL USING (public.is_platform_admin());

-- 4) social_campaigns — Kaufy interne Kampagnen
CREATE TABLE public.social_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  owner_role TEXT NOT NULL DEFAULT 'kaufy_admin',
  platform_targets JSONB DEFAULT '["facebook","instagram"]',
  campaign_type TEXT NOT NULL DEFAULT 'organic' CHECK (campaign_type IN ('organic','paid')),
  budget_cents INTEGER DEFAULT 0,
  spend_cents INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','live','paused','ended','failed')),
  creative_ids UUID[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_campaigns_tenant" ON public.social_campaigns FOR SELECT USING (tenant_id = (SELECT public.get_user_tenant_id()));
CREATE POLICY "social_campaigns_admin" ON public.social_campaigns FOR ALL USING (public.is_platform_admin());

-- 5) social_leads — Lead-Intake
CREATE TABLE public.social_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('meta_leadgen','landing','manual','other')),
  mandate_id UUID REFERENCES public.social_mandates(id),
  campaign_id UUID REFERENCES public.social_campaigns(id),
  partner_user_id UUID,
  platform TEXT CHECK (platform IN ('facebook','instagram','linkedin','other')),
  meta_payload_raw JSONB DEFAULT '{}',
  lead_data JSONB DEFAULT '{}',
  consent_flags JSONB DEFAULT '{}',
  autoresponder_status TEXT NOT NULL DEFAULT 'not_sent' CHECK (autoresponder_status IN ('not_sent','sent','failed')),
  routed_to_zone2 BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_leads_tenant" ON public.social_leads FOR SELECT USING (tenant_id = (SELECT public.get_user_tenant_id()));
CREATE POLICY "social_leads_partner" ON public.social_leads FOR SELECT USING (partner_user_id = auth.uid());
CREATE POLICY "social_leads_admin" ON public.social_leads FOR ALL USING (public.is_platform_admin());

-- 6) social_lead_events — Timeline/Audit
CREATE TABLE public.social_lead_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.social_leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('webhook_received','autoresponder_sent','routed','status_changed','note_added')),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_lead_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_lead_events_via_lead" ON public.social_lead_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.social_leads sl WHERE sl.id = lead_id AND (sl.tenant_id = (SELECT public.get_user_tenant_id()) OR sl.partner_user_id = auth.uid()))
);
CREATE POLICY "social_lead_events_admin" ON public.social_lead_events FOR ALL USING (public.is_platform_admin());

-- updated_at triggers
CREATE TRIGGER update_social_templates_updated_at BEFORE UPDATE ON public.social_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_mandates_updated_at BEFORE UPDATE ON public.social_mandates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_creatives_updated_at BEFORE UPDATE ON public.social_creatives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_campaigns_updated_at BEFORE UPDATE ON public.social_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_social_leads_updated_at BEFORE UPDATE ON public.social_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
