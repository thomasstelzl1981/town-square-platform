
-- =====================================================================
-- MOD-10 Lead Manager: Schema Extensions + New Tables + tile_catalog
-- =====================================================================

-- 1) social_brand_assets — Brand-Meta-Config (admin-only seed data)
CREATE TABLE IF NOT EXISTS public.social_brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_context text NOT NULL UNIQUE,
  display_name text NOT NULL,
  meta_ad_account_id text,
  meta_page_id text,
  meta_ig_actor_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_brand_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage brand assets" ON public.social_brand_assets FOR ALL USING (true);
CREATE POLICY "Authenticated users can read brand assets" ON public.social_brand_assets FOR SELECT TO authenticated USING (true);

-- Seed 4 brand contexts
INSERT INTO public.social_brand_assets (brand_context, display_name) VALUES
  ('futureroom', 'FutureRoom'),
  ('kaufy', 'Kaufy'),
  ('lennox_friends', 'Lennox & Friends'),
  ('acquiary', 'Acquiary')
ON CONFLICT (brand_context) DO NOTHING;

-- 2) social_meta_mapping — Maps internal mandates to Meta campaign IDs
CREATE TABLE IF NOT EXISTS public.social_meta_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid NOT NULL REFERENCES public.social_mandates(id) ON DELETE CASCADE,
  meta_campaign_id text,
  meta_adset_id text,
  meta_creative_id text,
  meta_ad_id text,
  meta_form_id text,
  meta_page_id text,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_meta_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mandate mappings" ON public.social_meta_mapping
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_mandates sm 
    WHERE sm.id = social_meta_mapping.mandate_id AND sm.partner_user_id = auth.uid()
  ));
CREATE INDEX idx_social_meta_mapping_mandate ON public.social_meta_mapping(mandate_id);
CREATE INDEX idx_social_meta_mapping_form ON public.social_meta_mapping(meta_form_id);

-- 3) social_budget_caps — Per-manager monthly spend limits
CREATE TABLE IF NOT EXISTS public.social_budget_caps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  monthly_cap_cents integer NOT NULL DEFAULT 500000,
  spend_month_to_date_cents integer NOT NULL DEFAULT 0,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_budget_caps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own budget caps" ON public.social_budget_caps
  FOR SELECT TO authenticated USING (manager_user_id = auth.uid());
CREATE INDEX idx_social_budget_caps_manager ON public.social_budget_caps(manager_user_id, tenant_id);

-- 4) ALTER social_mandates: add brand_context
ALTER TABLE public.social_mandates ADD COLUMN IF NOT EXISTS brand_context text NOT NULL DEFAULT 'kaufy';

-- 5) ALTER social_leads: add lead_status, notes, brand_context
ALTER TABLE public.social_leads ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new';
ALTER TABLE public.social_leads ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.social_leads ADD COLUMN IF NOT EXISTS brand_context text;

-- 6) ALTER social_templates: add brand_context
ALTER TABLE public.social_templates ADD COLUMN IF NOT EXISTS brand_context text NOT NULL DEFAULT 'kaufy';

-- 7) Update tile_catalog: MOD-10 → Lead Manager
UPDATE public.tile_catalog
SET 
  title = 'Lead Manager',
  main_tile_route = '/portal/lead-manager',
  sub_tiles = '[
    {"title": "Übersicht", "route": "/portal/lead-manager/uebersicht"},
    {"title": "Kampagnen", "route": "/portal/lead-manager/kampagnen"},
    {"title": "Studio", "route": "/portal/lead-manager/studio"},
    {"title": "Leads", "route": "/portal/lead-manager/leads"}
  ]'::jsonb,
  icon_key = 'Megaphone'
WHERE tile_code = 'MOD-10';

-- 8) Remove "Leadeingang" tile from MOD-09 sub_tiles if present
-- (handled in frontend manifest, no DB sub_tiles change needed for MOD-09)
