
-- 1. Extend handle_new_user() to auto-create primary household person
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_public_id text;
  role_tiles text[];
  tile text;
BEGIN
  -- Generate public ID for organization
  org_public_id := generate_public_id('T');
  
  -- Create default organization for new user
  INSERT INTO public.organizations (
    id, name, slug, org_type, public_id, depth, materialized_path, settings
  ) VALUES (
    gen_random_uuid(),
    COALESCE(split_part(NEW.email, '@', 1), 'Mein Unternehmen'),
    LOWER(REPLACE(COALESCE(split_part(NEW.email, '@', 1), 'org'), '.', '-')) || '-' || substr(md5(random()::text), 1, 6),
    'client',
    org_public_id,
    0,
    '/',
    '{}'::jsonb
  )
  RETURNING id INTO new_org_id;
  
  -- Create profile for new user
  INSERT INTO public.profiles (
    id, email, display_name, active_tenant_id
  ) VALUES (
    NEW.id, NEW.email, split_part(NEW.email, '@', 1), new_org_id
  );
  
  -- Create membership (org_admin role for own organization)
  INSERT INTO public.memberships (
    user_id, tenant_id, role
  ) VALUES (
    NEW.id, new_org_id, 'org_admin'
  );
  
  -- Create primary household person (Hauptperson) from signup data
  INSERT INTO public.household_persons (
    tenant_id, user_id, role, is_primary, sort_order,
    first_name, last_name, email
  ) VALUES (
    new_org_id,
    NEW.id,
    'hauptperson',
    true,
    0,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  
  -- Activate tiles based on role using SSOT function
  role_tiles := get_tiles_for_role('org_admin');
  FOREACH tile IN ARRAY role_tiles
  LOOP
    INSERT INTO public.tenant_tile_activation (tenant_id, tile_code, status, activated_at)
    VALUES (new_org_id, tile, 'active', now())
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 2. Backfill: Create primary person for existing accounts that don't have one
INSERT INTO public.household_persons (tenant_id, user_id, role, is_primary, sort_order, first_name, email)
SELECT 
  p.active_tenant_id,
  p.id,
  'hauptperson',
  true,
  0,
  COALESCE(p.display_name, split_part(p.email, '@', 1)),
  p.email
FROM public.profiles p
WHERE p.active_tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.household_persons hp 
    WHERE hp.tenant_id = p.active_tenant_id AND hp.is_primary = true
  );
