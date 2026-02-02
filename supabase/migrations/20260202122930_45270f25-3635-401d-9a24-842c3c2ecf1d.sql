-- ============================================================================
-- P0-ID-CTX-INTERNAL-DEFAULT: INTERNAL ORG IS DEFAULT CONTEXT FOR PLATFORM ADMIN
-- ============================================================================
-- Creates "System of a Town" internal organization and membership for thomas.stelzl

-- Step 1: Create internal organization
INSERT INTO public.organizations (
  id,
  name,
  slug,
  public_id,
  org_type,
  parent_id,
  materialized_path,
  depth,
  parent_access_blocked,
  settings
)
VALUES (
  'a0000000-0000-4000-a000-000000000001',
  'System of a Town',
  'sot-internal',
  'SOT-INTERNAL',
  'internal',
  NULL,
  '/',
  0,
  false,
  '{}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  org_type = EXCLUDED.org_type,
  updated_at = now();

-- Step 2: Create platform_admin membership for thomas.stelzl in internal org
INSERT INTO public.memberships (
  id,
  user_id,
  tenant_id,
  role
)
VALUES (
  'b0000000-0000-4000-b000-000000000001',
  'd028bc99-6e29-4fa4-b038-d03015faf222',
  'a0000000-0000-4000-a000-000000000001',
  'platform_admin'
)
ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = 'platform_admin',
  updated_at = now();

-- Step 3: Update thomas.stelzl's profile to default to internal org
UPDATE public.profiles
SET active_tenant_id = 'a0000000-0000-4000-a000-000000000001',
    updated_at = now()
WHERE id = 'd028bc99-6e29-4fa4-b038-d03015faf222';

-- Step 4: Demote thomas.stelzl in client org from platform_admin to org_admin
UPDATE public.memberships
SET role = 'org_admin',
    updated_at = now()
WHERE user_id = 'd028bc99-6e29-4fa4-b038-d03015faf222'
  AND tenant_id = 'e808a01b-728e-4ac3-88fe-6edeeae69d6e'
  AND role = 'platform_admin';