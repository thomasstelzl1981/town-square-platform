-- =============================================
-- INVESTMENT ENGINE: Master Data Tables
-- =============================================

-- Interest Rate Matrix (Zone 1 Master Data)
CREATE TABLE public.interest_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term_years INTEGER NOT NULL CHECK (term_years IN (5, 10, 15, 20, 25, 30)),
  ltv_percent INTEGER NOT NULL CHECK (ltv_percent BETWEEN 50 AND 100),
  interest_rate DECIMAL(5,3) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 15),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(term_years, ltv_percent, valid_from)
);

-- Tax Parameters (AfA rates, ancillary costs, etc.)
CREATE TABLE public.tax_parameters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'percent', -- percent, euro, years
  category VARCHAR(50) NOT NULL, -- afa, costs, tax
  description TEXT,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Church Tax Rates by State
CREATE TABLE public.church_tax_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state_code VARCHAR(2) NOT NULL UNIQUE,
  state_name VARCHAR(100) NOT NULL,
  rate DECIMAL(4,2) NOT NULL CHECK (rate IN (8.00, 9.00)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interest_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_tax_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read for all authenticated, Write for platform_admin
CREATE POLICY "interest_rates_select" ON public.interest_rates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "interest_rates_modify" ON public.interest_rates
  FOR ALL TO authenticated USING (public.is_platform_admin());

CREATE POLICY "tax_parameters_select" ON public.tax_parameters
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "tax_parameters_modify" ON public.tax_parameters
  FOR ALL TO authenticated USING (public.is_platform_admin());

CREATE POLICY "church_tax_rates_select" ON public.church_tax_rates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "church_tax_rates_modify" ON public.church_tax_rates
  FOR ALL TO authenticated USING (public.is_platform_admin());

-- Triggers for updated_at
CREATE TRIGGER update_interest_rates_updated_at
  BEFORE UPDATE ON public.interest_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tax_parameters_updated_at
  BEFORE UPDATE ON public.tax_parameters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_church_tax_rates_updated_at
  BEFORE UPDATE ON public.church_tax_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SEED DATA: Default Interest Rates (15 Jahre)
-- =============================================
INSERT INTO public.interest_rates (term_years, ltv_percent, interest_rate) VALUES
  -- 5 Jahre
  (5, 60, 3.50), (5, 70, 3.70), (5, 80, 3.90), (5, 90, 4.10), (5, 100, 4.30),
  -- 10 Jahre
  (10, 60, 3.70), (10, 70, 3.90), (10, 80, 4.10), (10, 90, 4.30), (10, 100, 4.50),
  -- 15 Jahre
  (15, 60, 4.00), (15, 70, 4.15), (15, 80, 4.30), (15, 90, 4.40), (15, 100, 4.50),
  -- 20 Jahre
  (20, 60, 4.20), (20, 70, 4.35), (20, 80, 4.50), (20, 90, 4.65), (20, 100, 4.80),
  -- 25 Jahre
  (25, 60, 4.40), (25, 70, 4.55), (25, 80, 4.70), (25, 90, 4.85), (25, 100, 5.00),
  -- 30 Jahre
  (30, 60, 4.60), (30, 70, 4.75), (30, 80, 4.90), (30, 90, 5.05), (30, 100, 5.20);

-- =============================================
-- SEED DATA: Tax Parameters
-- =============================================
INSERT INTO public.tax_parameters (code, name, value, unit, category, description) VALUES
  -- AfA Rates
  ('AFA_LINEAR', 'AfA Linear (Standard)', 2.0000, 'percent', 'afa', 'Standard-AfA für Gebäude ab 1925'),
  ('AFA_7I', 'AfA §7i (Denkmal)', 9.0000, 'percent', 'afa', 'Sonder-AfA für Denkmalobjekte (8 Jahre)'),
  ('AFA_7H', 'AfA §7h (Sanierungsgebiet)', 9.0000, 'percent', 'afa', 'Sonder-AfA in Sanierungsgebieten (8 Jahre)'),
  ('AFA_7B', 'AfA §7b (Neubau)', 5.0000, 'percent', 'afa', 'Sonder-AfA für Neubauten (4 Jahre)'),
  -- Costs
  ('VERWALTUNG_RATE', 'Verwaltungskosten', 25.0000, 'euro', 'costs', 'Monatliche Verwaltungskosten pro Einheit'),
  ('INSTANDHALTUNG_RATE', 'Instandhaltungsrücklage', 1.0000, 'percent', 'costs', 'Prozent der Jahreskaltmiete'),
  ('GRUNDERWERBSTEUER', 'Grunderwerbsteuer', 6.5000, 'percent', 'costs', 'Durchschnitt (variiert nach Bundesland)'),
  ('NOTAR_GRUNDBUCH', 'Notar & Grundbuch', 2.0000, 'percent', 'costs', 'Ca. 1.5% Notar + 0.5% Grundbuch'),
  ('MAKLER', 'Maklerprovision', 3.57000, 'percent', 'costs', 'Käuferanteil (inkl. MwSt)'),
  -- Tax
  ('SOLI_RATE', 'Solidaritätszuschlag', 5.5000, 'percent', 'tax', 'Auf Einkommensteuer'),
  ('FREIBETRAG_SINGLE', 'Grundfreibetrag (Ledig)', 11604.0000, 'euro', 'tax', 'Grundfreibetrag 2024'),
  ('FREIBETRAG_MARRIED', 'Grundfreibetrag (Verheiratet)', 23208.0000, 'euro', 'tax', 'Doppelter Grundfreibetrag 2024');

-- =============================================
-- SEED DATA: Church Tax Rates
-- =============================================
INSERT INTO public.church_tax_rates (state_code, state_name, rate) VALUES
  ('BW', 'Baden-Württemberg', 8.00),
  ('BY', 'Bayern', 8.00),
  ('BE', 'Berlin', 9.00),
  ('BB', 'Brandenburg', 9.00),
  ('HB', 'Bremen', 9.00),
  ('HH', 'Hamburg', 9.00),
  ('HE', 'Hessen', 9.00),
  ('MV', 'Mecklenburg-Vorpommern', 9.00),
  ('NI', 'Niedersachsen', 9.00),
  ('NW', 'Nordrhein-Westfalen', 9.00),
  ('RP', 'Rheinland-Pfalz', 9.00),
  ('SL', 'Saarland', 9.00),
  ('SN', 'Sachsen', 9.00),
  ('ST', 'Sachsen-Anhalt', 9.00),
  ('SH', 'Schleswig-Holstein', 9.00),
  ('TH', 'Thüringen', 9.00);
