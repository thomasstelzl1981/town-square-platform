
-- Massnahme A: Consent Templates Tabelle
CREATE TABLE public.consent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  title_de TEXT NOT NULL,
  body_de TEXT NOT NULL,
  required_for_module TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, version)
);

-- RLS aktivieren
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;

-- Consent Templates sind fuer alle authentifizierten Nutzer lesbar
CREATE POLICY "Authenticated users can read consent templates"
  ON public.consent_templates FOR SELECT
  TO authenticated
  USING (true);

-- Index fuer schnelle Abfragen
CREATE INDEX idx_consent_templates_code_active ON public.consent_templates (code, is_active);

-- Massnahme C: deleted_at Spalte auf PII-Tabellen
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.applicant_profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.self_disclosures ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
