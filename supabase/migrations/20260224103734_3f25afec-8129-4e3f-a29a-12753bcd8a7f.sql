-- ═══════════════════════════════════════════════════════════════
-- contact_strategy_ledger: Per-contact research strategy tracking
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE public.contact_strategy_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  category_code TEXT NOT NULL,
  strategy_code TEXT NOT NULL,
  steps_completed JSONB DEFAULT '[]'::jsonb,
  steps_pending JSONB DEFAULT '[]'::jsonb,
  data_gaps TEXT[] DEFAULT '{}',
  total_cost_eur NUMERIC(10,4) DEFAULT 0,
  quality_score NUMERIC(5,2) DEFAULT 0,
  last_step_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_strategy_ledger_contact ON public.contact_strategy_ledger(contact_id);
CREATE INDEX idx_strategy_ledger_tenant_category ON public.contact_strategy_ledger(tenant_id, category_code);
CREATE INDEX idx_strategy_ledger_strategy ON public.contact_strategy_ledger(strategy_code);
CREATE INDEX idx_strategy_ledger_tenant_created ON public.contact_strategy_ledger(tenant_id, created_at);

-- Enable RLS
ALTER TABLE public.contact_strategy_ledger ENABLE ROW LEVEL SECURITY;

-- RLS policies (active_tenant_id pattern)
CREATE POLICY "strategy_ledger_tenant_access"
  ON public.contact_strategy_ledger FOR ALL
  USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_contact_strategy_ledger_updated_at
  BEFORE UPDATE ON public.contact_strategy_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_strategy_ledger;