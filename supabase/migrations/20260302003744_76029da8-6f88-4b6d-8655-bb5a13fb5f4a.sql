
-- Add override columns to vv_annual_data for the Selbstauskunft-Pattern
-- Each override column allows manual correction of auto-calculated values
-- NULL = use auto-calculated value, NOT NULL = user override
ALTER TABLE public.vv_annual_data
  ADD COLUMN IF NOT EXISTS override_loan_interest NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_cold_rent NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_nk_advance NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_nk_nachzahlung NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_grundsteuer NUMERIC(12,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_non_recoverable NUMERIC(12,2) DEFAULT NULL;
