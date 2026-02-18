
-- =============================================
-- TENANT CREDIT BALANCE (Saldo-Tabelle)
-- =============================================
CREATE TABLE IF NOT EXISTS public.tenant_credit_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  balance_credits INTEGER NOT NULL DEFAULT 100, -- Startwert: 100 Credits gratis
  reserved_credits INTEGER NOT NULL DEFAULT 0,
  lifetime_purchased INTEGER NOT NULL DEFAULT 0,
  lifetime_consumed INTEGER NOT NULL DEFAULT 0,
  last_topup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenant_credit_balance_unique UNIQUE (tenant_id),
  CONSTRAINT balance_non_negative CHECK (balance_credits >= 0)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tenant_credit_balance_tenant ON public.tenant_credit_balance(tenant_id);

-- RLS
ALTER TABLE public.tenant_credit_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view their credit balance"
ON public.tenant_credit_balance FOR SELECT
USING (
  tenant_id IN (
    SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "Only service role can modify credit balance"
ON public.tenant_credit_balance FOR ALL
USING (false)
WITH CHECK (false);

-- Updated_at trigger
CREATE TRIGGER update_tenant_credit_balance_updated_at
  BEFORE UPDATE ON public.tenant_credit_balance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CREDIT PREFLIGHT FUNCTION (RPC)
-- =============================================
CREATE OR REPLACE FUNCTION public.rpc_credit_preflight(
  p_tenant_id UUID,
  p_required_credits INTEGER,
  p_action_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_balance INTEGER;
  v_reserved INTEGER;
  v_available INTEGER;
BEGIN
  -- Ensure balance row exists (lazy provisioning with 100 free credits)
  INSERT INTO tenant_credit_balance (tenant_id, balance_credits)
  VALUES (p_tenant_id, 100)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Get current balance
  SELECT balance_credits, reserved_credits
  INTO v_balance, v_reserved
  FROM tenant_credit_balance
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  v_available := v_balance - v_reserved;

  IF v_available >= p_required_credits THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'available_credits', v_available,
      'required_credits', p_required_credits,
      'cost_cents', p_required_credits * 25,
      'action_code', p_action_code
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', false,
      'available_credits', v_available,
      'required_credits', p_required_credits,
      'deficit_credits', p_required_credits - v_available,
      'cost_cents', p_required_credits * 25,
      'action_code', p_action_code,
      'message', 'Nicht genügend Credits. Bitte laden Sie Credits auf.'
    );
  END IF;
END;
$fn$;

-- =============================================
-- CREDIT DEDUCT FUNCTION (nach erfolgreicher Aktion)
-- =============================================
CREATE OR REPLACE FUNCTION public.rpc_credit_deduct(
  p_tenant_id UUID,
  p_credits INTEGER,
  p_action_code TEXT,
  p_ref_type TEXT DEFAULT NULL,
  p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Deduct credits
  UPDATE tenant_credit_balance
  SET balance_credits = balance_credits - p_credits,
      lifetime_consumed = lifetime_consumed + p_credits,
      updated_at = now()
  WHERE tenant_id = p_tenant_id
    AND balance_credits >= p_credits
  RETURNING balance_credits INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Log to credit_ledger
  INSERT INTO credit_ledger (tenant_id, user_id, kind, amount, ref_type, ref_id)
  VALUES (p_tenant_id, auth.uid(), 'debit', -p_credits, p_action_code, p_ref_id);

  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', p_credits,
    'new_balance', v_new_balance,
    'cost_cents', p_credits * 25
  );
END;
$fn$;

-- =============================================
-- CREDIT TOPUP FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.rpc_credit_topup(
  p_tenant_id UUID,
  p_credits INTEGER,
  p_ref_type TEXT DEFAULT 'manual',
  p_ref_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE tenant_credit_balance
  SET balance_credits = balance_credits + p_credits,
      lifetime_purchased = lifetime_purchased + p_credits,
      last_topup_at = now(),
      updated_at = now()
  WHERE tenant_id = p_tenant_id
  RETURNING balance_credits INTO v_new_balance;

  IF NOT FOUND THEN
    INSERT INTO tenant_credit_balance (tenant_id, balance_credits, lifetime_purchased, last_topup_at)
    VALUES (p_tenant_id, 100 + p_credits, p_credits, now())
    RETURNING balance_credits INTO v_new_balance;
  END IF;

  -- Log to credit_ledger
  INSERT INTO credit_ledger (tenant_id, user_id, kind, amount, ref_type, ref_id)
  VALUES (p_tenant_id, auth.uid(), 'credit', p_credits, p_ref_type, p_ref_id);

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits,
    'new_balance', v_new_balance
  );
END;
$fn$;
