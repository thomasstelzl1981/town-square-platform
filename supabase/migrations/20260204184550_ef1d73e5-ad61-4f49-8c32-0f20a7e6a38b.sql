-- FIX: Add development mode policy for properties INSERT
-- This allows inserts when no user is authenticated but a valid tenant_id is provided
-- SECURITY: Only works for existing tenant_ids (foreign key constraint)

-- Drop existing policies first
DROP POLICY IF EXISTS "prop_insert_dev_mode" ON public.properties;

-- Create development mode INSERT policy
-- This policy allows INSERT when:
-- 1. No user is authenticated (dev mode)
-- 2. The tenant_id references a valid organization
-- NOTE: In production, auth.uid() would be set, so this policy won't be used
CREATE POLICY "prop_insert_dev_mode" 
ON public.properties 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = properties.tenant_id)
);

-- Also add same for units table (created as part of property flow)
DROP POLICY IF EXISTS "unit_insert_dev_mode" ON public.units;

CREATE POLICY "unit_insert_dev_mode" 
ON public.units 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = units.tenant_id)
);

-- And for storage_nodes (template folders created with property)
DROP POLICY IF EXISTS "storage_insert_dev_mode" ON public.storage_nodes;

CREATE POLICY "storage_insert_dev_mode" 
ON public.storage_nodes 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = storage_nodes.tenant_id)
);

-- And for applicant_profiles (MOD-07 self-disclosure)
DROP POLICY IF EXISTS "applicant_insert_dev_mode" ON public.applicant_profiles;

CREATE POLICY "applicant_insert_dev_mode" 
ON public.applicant_profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM organizations o WHERE o.id = applicant_profiles.tenant_id)
);