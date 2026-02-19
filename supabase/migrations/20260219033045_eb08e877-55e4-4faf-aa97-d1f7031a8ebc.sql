
-- Extend deletion_requests for Art. 17 Phase 1 workflow
ALTER TABLE public.deletion_requests
  ADD COLUMN IF NOT EXISTS request_channel text NOT NULL DEFAULT 'EMAIL',
  ADD COLUMN IF NOT EXISTS request_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS requester_name text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS identity_method text,
  ADD COLUMN IF NOT EXISTS identity_notes text,
  ADD COLUMN IF NOT EXISTS scope_mode text NOT NULL DEFAULT 'FULL_ERASURE',
  ADD COLUMN IF NOT EXISTS scope_notes text,
  ADD COLUMN IF NOT EXISTS retention_notes text,
  ADD COLUMN IF NOT EXISTS erasure_summary text,
  ADD COLUMN IF NOT EXISTS response_status text NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS response_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS response_channel text,
  ADD COLUMN IF NOT EXISTS response_type text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS internal_notes text;

-- Add new deletion.* events to ledger whitelist
DO $$
BEGIN
  -- Update the log_data_event function to include deletion events
  -- We need to recreate/replace the function with the new whitelist
  -- First check current function and add new events
END $$;
