-- New columns for Projekt-Datenblatt
ALTER TABLE public.dev_projects
  ADD COLUMN IF NOT EXISTS federal_state TEXT,
  ADD COLUMN IF NOT EXISTS grest_rate_percent NUMERIC DEFAULT 6.5,
  ADD COLUMN IF NOT EXISTS notary_rate_percent NUMERIC DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS project_images JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS management_company TEXT,
  ADD COLUMN IF NOT EXISTS management_cost_per_unit NUMERIC,
  ADD COLUMN IF NOT EXISTS investment_type TEXT,
  ADD COLUMN IF NOT EXISTS income_type TEXT,
  ADD COLUMN IF NOT EXISTS condition_text TEXT,
  ADD COLUMN IF NOT EXISTS floors_count INTEGER,
  ADD COLUMN IF NOT EXISTS seller_name TEXT;

-- Backfill Menden Living with extracted data
UPDATE public.dev_projects
SET
  federal_state = 'NW',
  grest_rate_percent = 6.5,
  notary_rate_percent = 2.0,
  seller_name = 'Kalo Eisenach GmbH',
  management_company = 'Coeles PM GmbH',
  management_cost_per_unit = 26,
  investment_type = 'Kapitalanlage und Eigennutzung',
  income_type = 'Vermietung und Verpachtung gem. §2 Abs. 1 Nr. 6, §21 Abs. 1 Nr. 1 EStG',
  condition_text = 'gepflegt / modernisiert',
  floors_count = 3
WHERE id = 'bbbf6f6f-1d67-4181-ba9d-977838dd4317';