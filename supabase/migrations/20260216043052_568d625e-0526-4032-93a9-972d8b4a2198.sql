
-- 1. household_persons: 6 neue Einkommens-Spalten
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS gross_income_monthly NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS net_income_monthly NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS tax_class TEXT;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS child_allowances NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS business_income_monthly NUMERIC;
ALTER TABLE household_persons ADD COLUMN IF NOT EXISTS pv_income_monthly NUMERIC;

-- 2. pv_plants: 8 neue Darlehens-/Ertrags-Spalten
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_bank TEXT;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_amount NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_monthly_rate NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_interest_rate NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS loan_remaining_balance NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS annual_yield_kwh NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS feed_in_tariff_cents NUMERIC;
ALTER TABLE pv_plants ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC;
