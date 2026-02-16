-- Consolidate Demo-Daten: Max Mustermann (primary) applicant_profile
UPDATE public.applicant_profiles
SET
  living_expenses_monthly = 2200,
  self_employed_income_monthly = 1200,
  child_benefit_monthly = 500,
  health_insurance_monthly = 380,
  current_rent_monthly = 0,
  side_job_income_monthly = 0,
  other_regular_income_monthly = 0,
  rental_income_monthly = 2800,
  bank_savings = 45000,
  securities_value = 12000,
  life_insurance_value = 35000
WHERE id = '00000000-0000-4000-a000-000000000005'
  AND tenant_id = '00000000-0000-4000-a000-000000000001';

-- Lisa Mustermann: ensure complete financial data
UPDATE public.applicant_profiles
SET
  net_income_monthly = 3200,
  self_employed_income_monthly = 0,
  child_benefit_monthly = 0,
  living_expenses_monthly = 0,
  health_insurance_monthly = 280,
  current_rent_monthly = 0,
  side_job_income_monthly = 0,
  other_regular_income_monthly = 0,
  rental_income_monthly = 0,
  bank_savings = 18000,
  securities_value = 5000,
  life_insurance_value = 15000
WHERE id = '00000000-0000-4000-a000-000000000006'
  AND tenant_id = '00000000-0000-4000-a000-000000000001';