
-- KV-Contracts Tabelle: Krankenversicherungsdaten pro Haushaltsperson
CREATE TABLE public.kv_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  person_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  kv_type TEXT NOT NULL CHECK (kv_type IN ('PKV', 'GKV', 'familienversichert')),
  
  -- Basis (alle Typen)
  provider TEXT NOT NULL,
  insurance_number TEXT,
  monthly_premium NUMERIC(10,2) DEFAULT 0,
  employer_contribution NUMERIC(10,2),
  contract_start DATE,
  
  -- GKV-spezifisch
  contribution_rate TEXT,
  income_threshold NUMERIC(10,2),
  gross_income NUMERIC(10,2),
  family_insured_children INT,
  sick_pay_from_day INT,
  
  -- PKV-spezifisch: Tarif & Leistungen
  tariff_name TEXT,
  deductible NUMERIC(10,2),
  deductible_reduction_from_67 BOOLEAN DEFAULT false,
  daily_sickness_benefit NUMERIC(10,2),
  dental_prosthetics_percent INT,
  single_room BOOLEAN DEFAULT false,
  chief_physician BOOLEAN DEFAULT false,
  
  -- PKV: IHL (Innere Heilkunde Leistungen)
  ihl_outpatient_percent INT,
  ihl_inpatient_percent INT,
  ihl_psychotherapy_sessions INT,
  ihl_alternative_medicine BOOLEAN DEFAULT false,
  ihl_vision_aid_budget NUMERIC(10,2),
  ihl_hearing_aid_budget NUMERIC(10,2),
  ihl_rehabilitation TEXT,
  
  -- PKV: Beitragshistorie
  premium_adjustments JSONB DEFAULT '[]'::jsonb,
  
  -- Familienversichert
  insured_via_person_name TEXT,
  insured_until_age INT,
  
  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.kv_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant kv_contracts"
  ON public.kv_contracts FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own tenant kv_contracts"
  ON public.kv_contracts FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own tenant kv_contracts"
  ON public.kv_contracts FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own tenant kv_contracts"
  ON public.kv_contracts FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Timestamp trigger
CREATE TRIGGER update_kv_contracts_updated_at
  BEFORE UPDATE ON public.kv_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_kv_contracts_tenant ON public.kv_contracts(tenant_id);
CREATE INDEX idx_kv_contracts_person ON public.kv_contracts(person_id);
