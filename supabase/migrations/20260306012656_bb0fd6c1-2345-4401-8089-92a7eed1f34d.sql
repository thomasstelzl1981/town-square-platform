
-- ============================================================
-- SoT Valuation Engine V5.0 — Core Tables
-- ============================================================

-- 1. valuation_cases — one row per valuation run
CREATE TABLE public.valuation_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  source_context TEXT NOT NULL DEFAULT 'ACQUIARY_TOOLS',
  source_ref UUID,
  status TEXT NOT NULL DEFAULT 'draft',
  credits_charged INT NOT NULL DEFAULT 0,
  stage_current INT NOT NULL DEFAULT 0,
  stage_timings JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. valuation_inputs — extracted/normalized data per case
CREATE TABLE public.valuation_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.valuation_cases(id) ON DELETE CASCADE,
  canonical_snapshot JSONB DEFAULT '{}',
  extracted_fields JSONB DEFAULT '[]',
  missing_fields JSONB DEFAULT '[]',
  assumptions JSONB DEFAULT '[]',
  evidence_map JSONB DEFAULT '[]',
  data_quality JSONB DEFAULT '{}'
);

-- 3. valuation_results — all computation outputs
CREATE TABLE public.valuation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.valuation_cases(id) ON DELETE CASCADE,
  value_band JSONB DEFAULT '{}',
  valuation_methods JSONB DEFAULT '[]',
  financing JSONB DEFAULT '[]',
  stress_tests JSONB DEFAULT '[]',
  lien_proxy JSONB DEFAULT '{}',
  debt_service JSONB DEFAULT '{}',
  location_analysis JSONB DEFAULT '{}',
  comp_stats JSONB DEFAULT '{}',
  comp_postings JSONB DEFAULT '[]',
  sensitivity JSONB DEFAULT '{}',
  charts JSONB DEFAULT '{}'
);

-- 4. valuation_reports — generated report metadata
CREATE TABLE public.valuation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.valuation_cases(id) ON DELETE CASCADE,
  report_version INT NOT NULL DEFAULT 1,
  web_render_hash TEXT,
  pdf_file_ref TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS — tenant-scoped via get_user_memberships
-- ============================================================

ALTER TABLE public.valuation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.valuation_reports ENABLE ROW LEVEL SECURITY;

-- valuation_cases
CREATE POLICY "Users can view valuation_cases in their org" ON public.valuation_cases
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert valuation_cases in their org" ON public.valuation_cases
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update valuation_cases in their org" ON public.valuation_cases
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- valuation_inputs (via case join)
CREATE POLICY "Users can view valuation_inputs in their org" ON public.valuation_inputs
  FOR SELECT TO authenticated
  USING (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

CREATE POLICY "Users can insert valuation_inputs in their org" ON public.valuation_inputs
  FOR INSERT TO authenticated
  WITH CHECK (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

CREATE POLICY "Users can update valuation_inputs in their org" ON public.valuation_inputs
  FOR UPDATE TO authenticated
  USING (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

-- valuation_results (via case join)
CREATE POLICY "Users can view valuation_results in their org" ON public.valuation_results
  FOR SELECT TO authenticated
  USING (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

CREATE POLICY "Users can insert valuation_results in their org" ON public.valuation_results
  FOR INSERT TO authenticated
  WITH CHECK (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

CREATE POLICY "Users can update valuation_results in their org" ON public.valuation_results
  FOR UPDATE TO authenticated
  USING (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

-- valuation_reports (via case join)
CREATE POLICY "Users can view valuation_reports in their org" ON public.valuation_reports
  FOR SELECT TO authenticated
  USING (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

CREATE POLICY "Users can insert valuation_reports in their org" ON public.valuation_reports
  FOR INSERT TO authenticated
  WITH CHECK (case_id IN (
    SELECT id FROM public.valuation_cases
    WHERE tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
  ));

-- Service role for edge functions
CREATE POLICY "service_role_valuation_cases" ON public.valuation_cases
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_valuation_inputs" ON public.valuation_inputs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_valuation_results" ON public.valuation_results
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_valuation_reports" ON public.valuation_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);
