
-- =====================================================
-- SCHRITT 1: Signup-Trigger installieren + handle_new_user erweitern
-- =====================================================

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user to also activate standard tiles for new client orgs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_public_id text;
  standard_tiles text[] := ARRAY['MOD-01', 'MOD-03', 'MOD-04'];
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
  
  -- Activate standard tiles for the new organization
  FOREACH tile IN ARRAY standard_tiles
  LOOP
    INSERT INTO public.tenant_tile_activation (tenant_id, tile_code, status, activated_at)
    VALUES (new_org_id, tile, 'active', now())
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Install the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SCHRITT 3: Test-Personas (Orgs, Profiles, Memberships, Roles)
-- =====================================================

-- Get the platform admin user ID
DO $$
DECLARE
  admin_user_id uuid;
  org_vermieter uuid := 'b0000000-0000-4000-b000-000000000001';
  org_verkaeufer uuid := 'b0000000-0000-4000-b000-000000000002';
  org_partner uuid := 'b0000000-0000-4000-b000-000000000003';
  internal_org_id uuid;
BEGIN
  -- Find the platform admin
  SELECT p.id INTO admin_user_id
  FROM profiles p
  WHERE p.email = 'thomas.stelzl@systemofadown.com'
  LIMIT 1;

  -- Find the internal org
  SELECT id INTO internal_org_id
  FROM organizations
  WHERE org_type = 'internal'
  LIMIT 1;

  -- Skip if admin not found
  IF admin_user_id IS NULL OR internal_org_id IS NULL THEN
    RAISE NOTICE 'Admin or internal org not found, skipping test personas';
    RETURN;
  END IF;

  -- Create test organizations (idempotent via ON CONFLICT)
  INSERT INTO organizations (id, name, slug, org_type, public_id, depth, materialized_path, settings)
  VALUES
    (org_vermieter, 'Muster-Vermieter', 'muster-vermieter', 'client', 'SOT-T-TSTVERM', 0, '/', '{}'::jsonb),
    (org_verkaeufer, 'Muster-Verkäufer', 'muster-verkaeufer', 'client', 'SOT-T-TSTVERK', 0, '/', '{}'::jsonb),
    (org_partner, 'Muster-Partner GmbH', 'muster-partner', 'partner', 'SOT-T-TSTPART', 0, '/', '{}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Give admin memberships in test orgs so he can switch
  INSERT INTO memberships (user_id, tenant_id, role)
  VALUES
    (admin_user_id, org_vermieter, 'org_admin'),
    (admin_user_id, org_verkaeufer, 'org_admin'),
    (admin_user_id, org_partner, 'org_admin')
  ON CONFLICT DO NOTHING;

  -- Assign platform admin the akquise_manager and finance_manager roles
  INSERT INTO user_roles (user_id, role)
  VALUES
    (admin_user_id, 'akquise_manager'),
    (admin_user_id, 'platform_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Activate standard tiles for test orgs
  INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
  SELECT org_id, tile_code, 'active', now()
  FROM (
    VALUES (org_vermieter), (org_verkaeufer), (org_partner)
  ) AS orgs(org_id)
  CROSS JOIN (
    VALUES ('MOD-01'), ('MOD-02'), ('MOD-03'), ('MOD-04'), ('MOD-05'),
           ('MOD-06'), ('MOD-07'), ('MOD-08'), ('MOD-09'), ('MOD-10'),
           ('MOD-11'), ('MOD-12'), ('MOD-13'), ('MOD-14'), ('MOD-15'),
           ('MOD-16'), ('MOD-17'), ('MOD-18'), ('MOD-19'), ('MOD-20')
  ) AS tiles(tile_code)
  ON CONFLICT DO NOTHING;

END $$;
