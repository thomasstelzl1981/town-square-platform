-- Lisa Mustermann: vollständige Finanzdaten für Demo
UPDATE public.applicant_profiles
SET
  living_expenses_monthly = 0,
  self_employed_income_monthly = 0,
  child_benefit_monthly = 0,
  health_insurance_monthly = 280,
  current_rent_monthly = 0,
  side_job_income_monthly = 0,
  other_regular_income_monthly = 0,
  rental_income_monthly = 0,
  bank_savings = 18000,
  securities_value = 5000,
  life_insurance_value = 15000
WHERE id = '703e1648-5dbf-40da-8f5f-040dc04bbc31';