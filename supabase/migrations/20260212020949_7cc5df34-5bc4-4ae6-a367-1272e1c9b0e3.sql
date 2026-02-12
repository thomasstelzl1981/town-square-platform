
-- Finance submission logs: tracks each bank submission (email or external handoff)
CREATE TABLE public.finance_submission_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  finance_request_id UUID NOT NULL REFERENCES public.finance_requests(id) ON DELETE CASCADE,
  bank_contact_id UUID REFERENCES public.finance_bank_contacts(id),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'external')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'waiting', 'follow_up', 'approved', 'rejected', 'handed_over')),
  submitted_at TIMESTAMPTZ,
  response_received_at TIMESTAMPTZ,
  conditions_offered JSONB,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  email_subject TEXT,
  email_body TEXT,
  external_software_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.finance_submission_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own submission logs"
  ON public.finance_submission_logs FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own submission logs"
  ON public.finance_submission_logs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own submission logs"
  ON public.finance_submission_logs FOR UPDATE
  USING (auth.uid() = created_by);

-- Timestamp trigger
CREATE TRIGGER update_finance_submission_logs_updated_at
  BEFORE UPDATE ON public.finance_submission_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_finance_submission_logs_request ON public.finance_submission_logs(finance_request_id);
