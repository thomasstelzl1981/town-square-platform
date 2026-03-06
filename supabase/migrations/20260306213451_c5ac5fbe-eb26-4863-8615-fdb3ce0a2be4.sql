-- Add DELETE policies for valuation tables
-- valuation_cases: user can delete cases in their org
CREATE POLICY "Users can delete valuation_cases in their org"
ON public.valuation_cases
FOR DELETE
TO authenticated
USING (tenant_id IN (
  SELECT tenant_id FROM get_user_memberships(auth.uid())
));

-- valuation_reports: user can delete reports linked to cases in their org
CREATE POLICY "Users can delete valuation_reports in their org"
ON public.valuation_reports
FOR DELETE
TO authenticated
USING (case_id IN (
  SELECT id FROM valuation_cases
  WHERE tenant_id IN (
    SELECT tenant_id FROM get_user_memberships(auth.uid())
  )
));

-- valuation_results: user can delete results linked to cases in their org
CREATE POLICY "Users can delete valuation_results in their org"
ON public.valuation_results
FOR DELETE
TO authenticated
USING (case_id IN (
  SELECT id FROM valuation_cases
  WHERE tenant_id IN (
    SELECT tenant_id FROM get_user_memberships(auth.uid())
  )
));

-- valuation_inputs: user can delete inputs linked to cases in their org
CREATE POLICY "Users can delete valuation_inputs in their org"
ON public.valuation_inputs
FOR DELETE
TO authenticated
USING (case_id IN (
  SELECT id FROM valuation_cases
  WHERE tenant_id IN (
    SELECT tenant_id FROM get_user_memberships(auth.uid())
  )
));