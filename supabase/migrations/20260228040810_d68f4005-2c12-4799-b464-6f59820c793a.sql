
-- Create brand_articles table for the Content Engine (Phase D)
CREATE TABLE public.brand_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL CHECK (brand IN ('sot', 'kaufy', 'futureroom', 'acquiary', 'lennox', 'ncore', 'otto')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  author TEXT,
  og_image TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by TEXT DEFAULT 'manual',
  UNIQUE(brand, slug)
);

-- Enable RLS
ALTER TABLE public.brand_articles ENABLE ROW LEVEL SECURITY;

-- Public read for published articles (Zone 3 websites need this)
CREATE POLICY "Published articles are publicly readable"
  ON public.brand_articles
  FOR SELECT
  USING (is_published = true);

-- Authenticated users can manage articles
CREATE POLICY "Authenticated users can insert articles"
  ON public.brand_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON public.brand_articles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete articles"
  ON public.brand_articles
  FOR DELETE
  TO authenticated
  USING (true);

-- Index for efficient brand+slug lookups and listing
CREATE INDEX idx_brand_articles_brand_published ON public.brand_articles(brand, is_published, published_at DESC);
CREATE INDEX idx_brand_articles_slug ON public.brand_articles(brand, slug);

-- Update trigger for updated_at
CREATE TRIGGER update_brand_articles_updated_at
  BEFORE UPDATE ON public.brand_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
