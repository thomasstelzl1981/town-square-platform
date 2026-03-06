

# Fix: Valuation Engine Credit Deduction — null user_id

## Root Cause
`rpc_credit_deduct` (line 130 in migration) inserts `auth.uid()` as `user_id` into `credit_ledger`. The `sot-valuation-engine` edge function calls this RPC via `sbAdmin` (service role), which has no auth session. Therefore `auth.uid()` is null, violating the NOT NULL constraint.

The same issue affects `rpc_credit_topup` and `sot-credit-preflight` (which also uses `sbAdmin`).

## Fix

### 1. Database Migration — Add `p_user_id` parameter to `rpc_credit_deduct`

Alter the function to accept an explicit `p_user_id UUID` parameter and use `COALESCE(p_user_id, auth.uid())` for the insert. This supports both service-role calls (explicit user_id) and client calls (auth.uid() fallback).

```sql
CREATE OR REPLACE FUNCTION public.rpc_credit_deduct(
  p_tenant_id UUID,
  p_credits INTEGER,
  p_action_code TEXT,
  p_ref_type TEXT DEFAULT NULL,
  p_ref_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL  -- NEW
)
...
  INSERT INTO credit_ledger (tenant_id, user_id, kind, amount, ref_type, ref_id)
  VALUES (p_tenant_id, COALESCE(p_user_id, auth.uid()), 'debit', ...);
```

### 2. Edge Function — Pass user_id to RPC

In `supabase/functions/sot-valuation-engine/index.ts` (~line 419), add `p_user_id: userId` to the `rpc_credit_deduct` call. The `userId` is already available from the auth check earlier in the function.

**Requires:** UNFREEZE INFRA-edge_functions (for the edge function edit).

### 3. Also fix `sot-credit-preflight`

The same pattern exists in `sot-credit-preflight/index.ts` for the `deduct` action — it also calls `rpc_credit_deduct` via `sbAdmin` without passing a user_id. Add `p_user_id: user.id` there too.

## Files Changed
1. **New migration SQL** — Recreate `rpc_credit_deduct` with `p_user_id` parameter
2. `supabase/functions/sot-valuation-engine/index.ts` — Add `p_user_id` to RPC call
3. `supabase/functions/sot-credit-preflight/index.ts` — Add `p_user_id` to deduct RPC call

## Impact
- No breaking changes (new parameter has DEFAULT NULL, existing client-side calls still work via auth.uid() fallback)
- Fixes the 402 error for all service-role credit deductions

