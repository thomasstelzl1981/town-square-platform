
CREATE TABLE public.private_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  loan_purpose TEXT NOT NULL,
  bank_name TEXT,
  loan_amount NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  monthly_rate NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'aktiv',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.private_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view private_loans in their tenant"
  ON public.private_loans FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can insert private_loans in their tenant"
  ON public.private_loans FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update private_loans in their tenant"
  ON public.private_loans FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete private_loans in their tenant"
  ON public.private_loans FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE TRIGGER update_private_loans_updated_at
  BEFORE UPDATE ON public.private_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
