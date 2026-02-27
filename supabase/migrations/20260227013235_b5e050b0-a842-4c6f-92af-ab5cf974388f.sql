
-- Manual expenses table for MOD-18 Finanzanalyse
CREATE TABLE public.manual_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('miete', 'unterhalt', 'sonstige')),
  label TEXT NOT NULL DEFAULT '',
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant manual expenses"
  ON public.manual_expenses FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own tenant manual expenses"
  ON public.manual_expenses FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own tenant manual expenses"
  ON public.manual_expenses FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own tenant manual expenses"
  ON public.manual_expenses FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TRIGGER update_manual_expenses_updated_at
  BEFORE UPDATE ON public.manual_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
