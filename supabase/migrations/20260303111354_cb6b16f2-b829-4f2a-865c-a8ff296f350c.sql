-- Add unique constraint on dedupe_key for contact_staging upsert support
-- Only non-null dedupe_keys should be unique (partial unique index)
DROP INDEX IF EXISTS idx_contact_staging_dedupe;
CREATE UNIQUE INDEX idx_contact_staging_dedupe_unique ON public.contact_staging (dedupe_key) WHERE dedupe_key IS NOT NULL;