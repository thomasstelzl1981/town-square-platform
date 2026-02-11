
-- Add operational fields to future_room_cases for MOD-11 workflow
ALTER TABLE public.future_room_cases
  ADD COLUMN IF NOT EXISTS submission_channel text,
  ADD COLUMN IF NOT EXISTS submission_status text DEFAULT 'not_prepared',
  ADD COLUMN IF NOT EXISTS first_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

-- Add index on status for pipeline queries
CREATE INDEX IF NOT EXISTS idx_future_room_cases_status ON public.future_room_cases(status);
