
-- Add source column to finance_requests
ALTER TABLE public.finance_requests
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'portal';

-- Add source column to finance_mandates
ALTER TABLE public.finance_mandates
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'portal';

-- Add contact_email/phone for zone3 quick submissions (no user account)
ALTER TABLE public.finance_requests
ADD COLUMN IF NOT EXISTS contact_first_name text,
ADD COLUMN IF NOT EXISTS contact_last_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Index for filtering by source in Zone 1
CREATE INDEX IF NOT EXISTS idx_finance_requests_source ON public.finance_requests(source);
CREATE INDEX IF NOT EXISTS idx_finance_mandates_source ON public.finance_mandates(source);
