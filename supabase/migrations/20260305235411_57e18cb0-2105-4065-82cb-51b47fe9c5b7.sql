
-- Portal Search Runs: tracks each search execution
CREATE TABLE public.portal_search_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  search_params_json JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'running',
  metrics_json JSONB DEFAULT '{}',
  total_found INTEGER DEFAULT 0,
  total_new INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_search_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.portal_search_runs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Portal Listings: individual property listings found across portals
CREATE TABLE public.portal_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.portal_search_runs(id) ON DELETE SET NULL,
  source_portal TEXT NOT NULL,
  source_url TEXT,
  source_listing_id TEXT,
  title TEXT NOT NULL,
  price INTEGER,
  object_type TEXT,
  living_area_sqm NUMERIC,
  plot_area_sqm NUMERIC,
  address TEXT,
  city TEXT,
  zip_code TEXT,
  rooms NUMERIC,
  units_count INTEGER,
  year_built INTEGER,
  gross_yield NUMERIC,
  broker_name TEXT,
  raw_extract_json JSONB,
  cluster_fingerprint TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  score INTEGER,
  match_reasons_json JSONB,
  suppressed BOOLEAN NOT NULL DEFAULT false,
  suppression_reason TEXT,
  notes TEXT,
  tags TEXT[],
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_offer_id UUID REFERENCES public.acq_offers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.portal_listings
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

-- Indexes
CREATE INDEX idx_portal_listings_fingerprint ON public.portal_listings(tenant_id, cluster_fingerprint);
CREATE INDEX idx_portal_listings_status ON public.portal_listings(tenant_id, status, suppressed);
CREATE INDEX idx_portal_search_runs_tenant ON public.portal_search_runs(tenant_id, created_at DESC);
