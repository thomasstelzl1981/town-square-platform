
CREATE OR REPLACE FUNCTION public.rpc_credit_deduct(
  p_tenant_id UUID,
  p_credits INTEGER,
  p_action_code TEXT,
  p_ref_type TEXT DEFAULT NULL,
  p_ref_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
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
  VALUES (p_tenant_id, COALESCE(p_user_id, auth.uid()), 'debit', -p_credits, p_action_code, p_ref_id);

  RETURN jsonb_build_object(
    'success', true,
    'credits_deducted', p_credits,
    'new_balance', v_new_balance,
    'cost_cents', p_credits * 25
  );
END;
$fn$;
