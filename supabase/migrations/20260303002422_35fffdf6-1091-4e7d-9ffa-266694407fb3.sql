-- Add z3_customer_id to pet_service_cases for Zone 3 customers (non-Supabase-auth users)
ALTER TABLE public.pet_service_cases
ADD COLUMN z3_customer_id uuid DEFAULT NULL;

-- Allow anon users (Z3) to insert cases
CREATE POLICY "Z3 customers can create cases"
ON public.pet_service_cases
FOR INSERT
TO anon
WITH CHECK (z3_customer_id IS NOT NULL);

-- Allow anon users (Z3) to read their own cases
CREATE POLICY "Z3 customers can view their cases"
ON public.pet_service_cases
FOR SELECT
TO anon
USING (z3_customer_id IS NOT NULL);

-- Allow anon users (Z3) to insert events for their cases
CREATE POLICY "Z3 customers can insert events for their cases"
ON public.pet_lifecycle_events
FOR INSERT
TO anon
WITH CHECK (case_id IN (
  SELECT id FROM pet_service_cases WHERE z3_customer_id IS NOT NULL
));

-- Allow anon users (Z3) to view events for their cases  
CREATE POLICY "Z3 customers can view events for their cases"
ON public.pet_lifecycle_events
FOR SELECT
TO anon
USING (case_id IN (
  SELECT id FROM pet_service_cases WHERE z3_customer_id IS NOT NULL
));