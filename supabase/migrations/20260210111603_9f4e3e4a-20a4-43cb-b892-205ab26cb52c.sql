
-- =====================================================
-- MIGRATION: Rollen-Tile-Integration (Konsolidierter Plan)
-- =====================================================

-- SCHRITT 1: app_role Enum erweitern
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client_user';

-- SCHRITT 2: get_tiles_for_role() — SSOT-Funktion
CREATE OR REPLACE FUNCTION public.get_tiles_for_role(p_role text)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_tiles text[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-15','MOD-16','MOD-17','MOD-18','MOD-20'
  ];
  all_tiles text[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
    'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
    'MOD-18','MOD-19','MOD-20'
  ];
BEGIN
  CASE p_role
    WHEN 'org_admin' THEN
      RETURN base_tiles;
    WHEN 'sales_partner' THEN
      RETURN base_tiles || ARRAY['MOD-09','MOD-10'];
    WHEN 'finance_manager' THEN
      RETURN base_tiles || ARRAY['MOD-11'];
    WHEN 'akquise_manager' THEN
      RETURN base_tiles || ARRAY['MOD-12'];
    WHEN 'platform_admin' THEN
      RETURN all_tiles;
    ELSE
      -- Legacy/unknown roles get base tiles
      RETURN base_tiles;
  END CASE;
END;
$$;

-- SCHRITT 3: handle_new_user() — nutzt jetzt get_tiles_for_role()
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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

-- Reinstall trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- SCHRITT 4: Test-Org Tiles korrigieren
-- Muster-Vermieter (org_admin): nur 14 Basis-Module
DELETE FROM tenant_tile_activation 
WHERE tenant_id = 'b0000000-0000-4000-b000-000000000001'
  AND tile_code IN ('MOD-09','MOD-10','MOD-11','MOD-12','MOD-13','MOD-14','MOD-19');

-- MOD-00 hinzufügen (falls fehlend)
INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
VALUES ('b0000000-0000-4000-b000-000000000001', 'MOD-00', 'active', now())
ON CONFLICT DO NOTHING;

-- Muster-Verkäufer (org_admin): nur 14 Basis-Module
DELETE FROM tenant_tile_activation 
WHERE tenant_id = 'b0000000-0000-4000-b000-000000000002'
  AND tile_code IN ('MOD-09','MOD-10','MOD-11','MOD-12','MOD-13','MOD-14','MOD-19');

INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
VALUES ('b0000000-0000-4000-b000-000000000002', 'MOD-00', 'active', now())
ON CONFLICT DO NOTHING;

-- Muster-Partner GmbH (sales_partner): 14 Basis + MOD-09 + MOD-10
DELETE FROM tenant_tile_activation 
WHERE tenant_id = 'b0000000-0000-4000-b000-000000000003'
  AND tile_code IN ('MOD-11','MOD-12','MOD-13','MOD-14','MOD-19');

INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
VALUES ('b0000000-0000-4000-b000-000000000003', 'MOD-00', 'active', now())
ON CONFLICT DO NOTHING;

-- System of a Town (internal): alle 21 bleiben — MOD-00 sicherstellen
INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
SELECT id, 'MOD-00', 'active', now()
FROM organizations WHERE org_type = 'internal'
ON CONFLICT DO NOTHING;
