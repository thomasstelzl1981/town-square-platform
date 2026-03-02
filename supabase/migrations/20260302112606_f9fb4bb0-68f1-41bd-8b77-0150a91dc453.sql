
-- Rename msv_bank_accounts to bank_accounts
ALTER TABLE public.msv_bank_accounts RENAME TO bank_accounts;

-- Rename the index
ALTER INDEX IF EXISTS idx_msv_bank_accounts_tenant RENAME TO idx_bank_accounts_tenant;

-- Rename the trigger
ALTER TRIGGER update_msv_bank_accounts_updated_at ON public.bank_accounts RENAME TO update_bank_accounts_updated_at;

-- Rename the FK constraint
ALTER TABLE public.bank_accounts RENAME CONSTRAINT msv_bank_accounts_tenant_id_fkey TO bank_accounts_tenant_id_fkey;

-- Rename the PK constraint  
ALTER TABLE public.bank_accounts RENAME CONSTRAINT msv_bank_accounts_pkey TO bank_accounts_pkey;
