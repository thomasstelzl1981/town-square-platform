-- Add unique constraint on finapi_transaction_id for upsert support
-- First check if it exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'finapi_transactions_finapi_transaction_id_key'
  ) THEN
    ALTER TABLE public.finapi_transactions
    ADD CONSTRAINT finapi_transactions_finapi_transaction_id_key UNIQUE (finapi_transaction_id);
  END IF;
END $$;

-- Add finapi_account_id column to msv_bank_accounts if not exists
ALTER TABLE public.msv_bank_accounts
ADD COLUMN IF NOT EXISTS finapi_account_id text;