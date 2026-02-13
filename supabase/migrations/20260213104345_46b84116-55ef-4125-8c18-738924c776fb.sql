
ALTER TABLE public.mail_accounts
  ADD COLUMN IF NOT EXISTS sync_mail boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sync_calendar boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sync_contacts boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_calendar_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contacts_sync_at timestamptz;
