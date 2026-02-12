
-- Drop the overly permissive policy (already dropped in previous failed attempt, but safe)
DROP POLICY IF EXISTS "Service role full access on public_project_submissions" ON public.public_project_submissions;

-- Only internal org users can read submissions
CREATE POLICY "Internal admins can read submissions"
  ON public.public_project_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.organizations o ON o.id = p.active_tenant_id
      WHERE p.id = auth.uid() AND o.org_type = 'internal'
    )
  );
