-- Create Platform Admin user for admin@systemofatown.com
-- Step 1: Create the auth user (password will be set via "Forgot Password" flow)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  'b0000000-0000-4000-b000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@systemofatown.com',
  -- This is a bcrypt hash of a temporary password that must be changed
  crypt('TempPassword123!', gen_salt('bf')),
  now(), -- Email confirmed immediately
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Thomas Stelzl"}'::jsonb,
  'authenticated',
  'authenticated',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create profile (linked to internal org)
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  active_tenant_id,
  created_at,
  updated_at
) VALUES (
  'b0000000-0000-4000-b000-000000000001'::uuid,
  'admin@systemofatown.com',
  'Thomas Stelzl',
  'a0000000-0000-4000-a000-000000000001'::uuid, -- Internal org (System of a Town)
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  active_tenant_id = EXCLUDED.active_tenant_id,
  updated_at = now();

-- Step 3: Create platform_admin membership for internal org
INSERT INTO public.memberships (
  user_id,
  tenant_id,
  role,
  created_at,
  updated_at
) VALUES (
  'b0000000-0000-4000-b000-000000000001'::uuid,
  'a0000000-0000-4000-a000-000000000001'::uuid, -- Internal org
  'platform_admin',
  now(),
  now()
) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = 'platform_admin',
  updated_at = now();

-- Step 4: Also give org_admin access to Muster-Kunde org for testing
-- First ensure Muster-Kunde org exists
INSERT INTO public.organizations (
  id,
  name,
  slug,
  public_id,
  org_type,
  depth,
  materialized_path,
  settings,
  created_at,
  updated_at
) VALUES (
  'c0000000-0000-4000-c000-000000000001'::uuid,
  'Muster-Kunde',
  'muster-kunde',
  'SOT-T-MUSTERKND',
  'client',
  0,
  '/',
  '{}'::jsonb,
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Add org_admin membership for Muster-Kunde
INSERT INTO public.memberships (
  user_id,
  tenant_id,
  role,
  created_at,
  updated_at
) VALUES (
  'b0000000-0000-4000-b000-000000000001'::uuid,
  'c0000000-0000-4000-c000-000000000001'::uuid, -- Muster-Kunde org
  'org_admin',
  now(),
  now()
) ON CONFLICT (user_id, tenant_id) DO UPDATE SET
  role = 'org_admin',
  updated_at = now();