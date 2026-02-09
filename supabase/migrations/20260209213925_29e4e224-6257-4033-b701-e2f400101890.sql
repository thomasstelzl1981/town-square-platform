
-- Fix: Remove overly permissive policy, replace with role-specific
DROP POLICY "Service role full access on task_widgets" ON public.task_widgets;

-- Service role uses SECURITY DEFINER functions or direct access via service key,
-- which bypasses RLS anyway. No additional policy needed.
