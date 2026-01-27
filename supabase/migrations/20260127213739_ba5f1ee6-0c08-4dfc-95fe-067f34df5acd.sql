-- listing_views Tabelle für MOD-06 Reporting
CREATE TABLE public.listing_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  viewer_ip_hash TEXT,
  viewer_session TEXT,
  source TEXT DEFAULT 'kaufy',
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_listing_views_listing_id ON public.listing_views(listing_id);
CREATE INDEX idx_listing_views_viewed_at ON public.listing_views(viewed_at);
CREATE INDEX idx_listing_views_tenant_id ON public.listing_views(tenant_id);

-- Enable RLS
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant kann eigene Views sehen
CREATE POLICY "Tenants can view own listing views" 
ON public.listing_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.get_user_memberships(auth.uid()) m
    WHERE m.tenant_id = listing_views.tenant_id
  )
);

-- Insert Policy für öffentliche Views (z.B. von Zone 3)
CREATE POLICY "Allow insert for tracking" 
ON public.listing_views 
FOR INSERT 
WITH CHECK (true);

COMMENT ON TABLE public.listing_views IS 'Tracks views of listings for MOD-06 Reporting';