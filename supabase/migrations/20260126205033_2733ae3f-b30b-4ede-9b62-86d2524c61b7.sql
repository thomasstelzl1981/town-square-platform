-- Create msv_bank_accounts table for FinAPI account connections
CREATE TABLE public.msv_bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  iban text NOT NULL,
  bank_name text,
  finapi_account_id text,
  is_default boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('connected', 'pending', 'error')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add index on tenant_id for performance
CREATE INDEX idx_msv_bank_accounts_tenant ON public.msv_bank_accounts(tenant_id);

-- Enable RLS
ALTER TABLE public.msv_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
CREATE POLICY "Users can view their tenant bank accounts"
ON public.msv_bank_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.tenant_id = msv_bank_accounts.tenant_id
  )
);

CREATE POLICY "Org admins can manage bank accounts"
ON public.msv_bank_accounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m 
    WHERE m.user_id = auth.uid() 
    AND m.tenant_id = msv_bank_accounts.tenant_id
    AND m.role IN ('org_admin', 'platform_admin')
  )
);

-- Add automation settings columns to msv_communication_prefs if not exist
-- These control when reminders and reports are sent
ALTER TABLE public.msv_communication_prefs 
  ADD COLUMN IF NOT EXISTS reminder_day integer DEFAULT 10 CHECK (reminder_day >= 1 AND reminder_day <= 28),
  ADD COLUMN IF NOT EXISTS report_day integer DEFAULT 15 CHECK (report_day >= 1 AND report_day <= 28),
  ADD COLUMN IF NOT EXISTS auto_reminder_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_report_enabled boolean DEFAULT false;

-- Add trigger for updated_at
CREATE TRIGGER update_msv_bank_accounts_updated_at
BEFORE UPDATE ON public.msv_bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();