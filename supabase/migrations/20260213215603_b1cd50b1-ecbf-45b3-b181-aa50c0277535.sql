
-- MSV Module Tables (MOD-05)

-- 1. Rent Payments
CREATE TABLE public.msv_rent_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  property_id UUID NOT NULL,
  unit_id UUID,
  lease_id UUID,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL,
  expected_amount NUMERIC(12,2) DEFAULT 0,
  received_amount NUMERIC(12,2) DEFAULT 0,
  received_date DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','bank_sync','dms_detected')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','paid','overdue')),
  note TEXT,
  dunning_stage INT NOT NULL DEFAULT 0 CHECK (dunning_stage BETWEEN 0 AND 3),
  dunning_last_sent_at TIMESTAMPTZ,
  dunning_next_due_at TIMESTAMPTZ,
  dunning_channel TEXT CHECK (dunning_channel IN ('email','letter')),
  dunning_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.msv_rent_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msv_rent_payments_select" ON public.msv_rent_payments FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_rent_payments_insert" ON public.msv_rent_payments FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_rent_payments_update" ON public.msv_rent_payments FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_rent_payments_delete" ON public.msv_rent_payments FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 2. Action Notes
CREATE TABLE public.msv_action_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  property_id UUID,
  unit_id UUID,
  lease_id UUID,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);
ALTER TABLE public.msv_action_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msv_action_notes_select" ON public.msv_action_notes FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_action_notes_insert" ON public.msv_action_notes FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_action_notes_update" ON public.msv_action_notes FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_action_notes_delete" ON public.msv_action_notes FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 3. Book Values
CREATE TABLE public.msv_book_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  property_id UUID NOT NULL,
  unit_id UUID,
  usage_type TEXT,
  ak_ground NUMERIC(14,2) DEFAULT 0,
  ak_building NUMERIC(14,2) DEFAULT 0,
  ak_ancillary NUMERIC(14,2) DEFAULT 0,
  afa_rate_percent NUMERIC(5,2) DEFAULT 2.0,
  afa_begin_date DATE,
  cumulative_afa NUMERIC(14,2) DEFAULT 0,
  book_value_date DATE,
  loan_id TEXT,
  outstanding_balance NUMERIC(14,2),
  interest_rate NUMERIC(5,2),
  book_value_estimate NUMERIC(14,2),
  book_value_status TEXT NOT NULL DEFAULT 'estimated' CHECK (book_value_status IN ('estimated','confirmed')),
  book_value_confirmed_at TIMESTAMPTZ,
  book_value_confirmed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.msv_book_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msv_book_values_select" ON public.msv_book_values FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_book_values_insert" ON public.msv_book_values FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_book_values_update" ON public.msv_book_values FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_book_values_delete" ON public.msv_book_values FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 4. BWA Entries
CREATE TABLE public.msv_bwa_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  property_id UUID NOT NULL,
  bwa_category TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT,
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.msv_bwa_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msv_bwa_entries_select" ON public.msv_bwa_entries FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_bwa_entries_insert" ON public.msv_bwa_entries FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_bwa_entries_update" ON public.msv_bwa_entries FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "msv_bwa_entries_delete" ON public.msv_bwa_entries FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 5. Add rent increase columns to leases
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS last_rent_increase_at DATE;
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS rent_increase_cycle_months INT DEFAULT 36;
