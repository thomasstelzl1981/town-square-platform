
-- Page views table for GDPR-compliant, cookie-less analytics
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  country_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for efficient querying by brand + date
CREATE INDEX idx_page_views_brand_created ON public.page_views (brand, created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views (brand, path);

-- Enable RLS (public insert, restricted read)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (no auth needed for page tracking)
CREATE POLICY "Anyone can insert page views"
ON public.page_views FOR INSERT
WITH CHECK (true);

-- Only authenticated users (portal) can read analytics
CREATE POLICY "Authenticated users can read page views"
ON public.page_views FOR SELECT
USING (auth.uid() IS NOT NULL);
