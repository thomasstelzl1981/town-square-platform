
-- Add source_brand and applicant contact fields for anonymous applications
ALTER TABLE public.manager_applications ADD COLUMN IF NOT EXISTS source_brand text;
ALTER TABLE public.manager_applications ADD COLUMN IF NOT EXISTS applicant_name text;
ALTER TABLE public.manager_applications ADD COLUMN IF NOT EXISTS applicant_email text;
ALTER TABLE public.manager_applications ADD COLUMN IF NOT EXISTS applicant_phone text;

-- Make tenant_id and user_id nullable (applicant has no account yet)
ALTER TABLE public.manager_applications ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.manager_applications ALTER COLUMN user_id DROP NOT NULL;

-- RLS: Allow anonymous and authenticated inserts for submitted applications
CREATE POLICY "anon_can_submit_application" ON public.manager_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'submitted');
