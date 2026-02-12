-- Part 1: Add §34i regulatory fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reg_34i_number text,
  ADD COLUMN IF NOT EXISTS reg_34i_ihk text,
  ADD COLUMN IF NOT EXISTS reg_34i_authority text,
  ADD COLUMN IF NOT EXISTS reg_vermittler_id text,
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_policy_no text;

-- Part 2: Add applicant_snapshot to finance_requests
ALTER TABLE public.finance_requests
  ADD COLUMN IF NOT EXISTS applicant_snapshot jsonb;