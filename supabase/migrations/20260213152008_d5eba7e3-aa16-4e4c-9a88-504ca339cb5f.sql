
-- consumer_loan_cases
CREATE TABLE public.consumer_loan_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  source_profile_id UUID REFERENCES public.applicant_profiles(id),
  employment_status TEXT NOT NULL DEFAULT 'employed',
  requested_amount NUMERIC,
  requested_term_months INTEGER,
  selected_offer_id TEXT,
  selected_offer_data JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  provider TEXT NOT NULL DEFAULT 'europace',
  provider_case_ref TEXT,
  consent_data_correct BOOLEAN NOT NULL DEFAULT false,
  consent_credit_check BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consumer_loan_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clc_select" ON public.consumer_loan_cases FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "clc_insert" ON public.consumer_loan_cases FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "clc_update" ON public.consumer_loan_cases FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER update_consumer_loan_cases_updated_at
  BEFORE UPDATE ON public.consumer_loan_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- consumer_loan_documents
CREATE TABLE public.consumer_loan_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.consumer_loan_cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  dms_document_id UUID,
  status TEXT NOT NULL DEFAULT 'missing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consumer_loan_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cld_select" ON public.consumer_loan_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.consumer_loan_cases c WHERE c.id = consumer_loan_documents.case_id AND c.tenant_id = public.get_user_tenant_id()));

CREATE POLICY "cld_insert" ON public.consumer_loan_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.consumer_loan_cases c WHERE c.id = consumer_loan_documents.case_id AND c.tenant_id = public.get_user_tenant_id()));

CREATE POLICY "cld_update" ON public.consumer_loan_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.consumer_loan_cases c WHERE c.id = consumer_loan_documents.case_id AND c.tenant_id = public.get_user_tenant_id()));
