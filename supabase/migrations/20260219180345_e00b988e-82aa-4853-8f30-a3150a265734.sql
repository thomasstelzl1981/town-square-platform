
-- ============================================================
-- Phase 2: Unified Transaction View + match_category column
-- Engine 17: ENG-KONTOMATCH
-- ============================================================

-- 1) Add match_category to bank_transactions (CSV-imported)
ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS match_category TEXT,
  ADD COLUMN IF NOT EXISTS match_confidence DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS match_rule_code TEXT;

-- 2) Add match_category to finapi_transactions (already has some match fields)
ALTER TABLE public.finapi_transactions
  ADD COLUMN IF NOT EXISTS match_category TEXT,
  ADD COLUMN IF NOT EXISTS match_rule_code TEXT;

-- 3) Create the unified view joining both sources with owner context
CREATE OR REPLACE VIEW public.v_all_transactions AS
SELECT
  bt.id,
  bt.tenant_id,
  bt.account_ref,
  bt.booking_date,
  bt.value_date,
  bt.amount_eur AS amount,
  bt.counterparty,
  bt.purpose_text AS purpose,
  bt.match_status,
  bt.match_category,
  bt.match_confidence,
  bt.match_rule_code,
  NULL::text AS counterpart_iban,
  'csv'::text AS source,
  ba.owner_type,
  ba.owner_id,
  bt.created_at
FROM public.bank_transactions bt
LEFT JOIN public.msv_bank_accounts ba
  ON ba.tenant_id = bt.tenant_id
  AND (ba.iban = bt.account_ref OR ba.finapi_account_id = bt.account_ref)

UNION ALL

SELECT
  ft.id,
  ft.tenant_id,
  COALESCE(ft.finapi_transaction_id, ft.id::text) AS account_ref,
  ft.booking_date,
  ft.value_date,
  ft.amount,
  ft.counterpart_name AS counterparty,
  ft.purpose,
  ft.match_status,
  ft.match_category,
  ft.match_confidence,
  NULL::text AS match_rule_code,
  ft.counterpart_iban,
  'finapi'::text AS source,
  ba.owner_type,
  ba.owner_id,
  ft.created_at
FROM public.finapi_transactions ft
LEFT JOIN public.msv_bank_accounts ba
  ON ba.tenant_id = ft.tenant_id
  AND ba.finapi_account_id = ft.connection_id::text
;

-- 4) Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_bank_transactions_match_category
  ON public.bank_transactions (match_category)
  WHERE match_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_finapi_transactions_match_category
  ON public.finapi_transactions (match_category)
  WHERE match_category IS NOT NULL;
