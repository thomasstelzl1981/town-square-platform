
-- Create content_topics table
CREATE TABLE public.content_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  title_prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'ratgeber',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed', 'in_progress')),
  published_article_id UUID REFERENCES public.brand_articles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;

-- Public read access (topics are not sensitive)
CREATE POLICY "Content topics are publicly readable"
  ON public.content_topics FOR SELECT USING (true);

-- Service role can do everything (edge function uses service role)
-- No insert/update/delete policies needed for anon since only the edge function writes

-- Seed initial topics
INSERT INTO public.content_topics (brand, title_prompt, category) VALUES
  -- Kaufy
  ('kaufy', 'Rendite bei Kapitalanlageimmobilien', 'ratgeber'),
  ('kaufy', 'Nebenkosten für Vermieter', 'ratgeber'),
  ('kaufy', 'Mietrendite berechnen', 'ratgeber'),
  ('kaufy', 'Steuervorteile Vermietung', 'ratgeber'),
  -- FutureRoom
  ('futureroom', 'Bonitätsprüfung erklärt', 'ratgeber'),
  ('futureroom', 'Baufinanzierung 2026', 'ratgeber'),
  ('futureroom', 'KfW-Fördermittel', 'ratgeber'),
  ('futureroom', 'Tilgungsplan verstehen', 'ratgeber'),
  -- Acquiary
  ('acquiary', 'Off-Market Deals', 'ratgeber'),
  ('acquiary', 'Institutionelle Akquise', 'ratgeber'),
  ('acquiary', 'Due Diligence Immobilien', 'ratgeber'),
  ('acquiary', 'Portfolio-Ankauf', 'ratgeber'),
  -- Lennox
  ('lennox', 'Hundepension vs. Hundesitter', 'ratgeber'),
  ('lennox', 'Reisen mit Hund', 'ratgeber'),
  ('lennox', 'Hundeversicherung', 'ratgeber'),
  ('lennox', 'Erstausstattung Welpe', 'ratgeber'),
  -- Ncore
  ('ncore', 'Digitalisierung Finanzbranche', 'ratgeber'),
  ('ncore', 'API-First Plattformen', 'ratgeber'),
  ('ncore', 'Cloud-Infrastruktur', 'ratgeber'),
  ('ncore', 'Datengetriebene Entscheidungen', 'ratgeber'),
  -- Otto²
  ('otto', 'Projektmanagement Immobilien', 'ratgeber'),
  ('otto', 'Bauträger-Kalkulation', 'ratgeber'),
  ('otto', 'Nachhaltiges Bauen', 'ratgeber'),
  ('otto', 'Smart Home Integration', 'ratgeber');

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
