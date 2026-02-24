
-- ============================================================
-- 1. get_tiles_for_role() aktualisieren: 8 Rollen, 22 Module
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_tiles_for_role(p_role text)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_tiles text[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-15','MOD-16','MOD-17','MOD-18','MOD-20'
  ];
  all_tiles text[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
    'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
    'MOD-18','MOD-19','MOD-20','MOD-22'
  ];
BEGIN
  CASE p_role
    WHEN 'org_admin' THEN
      RETURN base_tiles;
    WHEN 'super_user' THEN
      RETURN all_tiles;
    WHEN 'sales_partner' THEN
      RETURN base_tiles || ARRAY['MOD-09','MOD-10'];
    WHEN 'finance_manager' THEN
      RETURN base_tiles || ARRAY['MOD-11'];
    WHEN 'akquise_manager' THEN
      RETURN base_tiles || ARRAY['MOD-12'];
    WHEN 'project_manager' THEN
      RETURN base_tiles || ARRAY['MOD-13'];
    WHEN 'pet_manager' THEN
      RETURN base_tiles || ARRAY['MOD-22','MOD-10'];
    WHEN 'platform_admin' THEN
      RETURN all_tiles;
    ELSE
      RETURN base_tiles;
  END CASE;
END;
$function$;

-- ============================================================
-- 2. sync_tiles_for_user() erstellen
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_tiles_for_user(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_membership_role text;
  v_app_role text;
  v_effective_role text;
  v_target_tiles text[];
  v_tile text;
BEGIN
  -- 1. Get tenant and membership role
  SELECT m.tenant_id, m.role::text
  INTO v_tenant_id, v_membership_role
  FROM memberships m
  WHERE m.user_id = p_user_id
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No membership found for user %', p_user_id;
  END IF;

  -- 2. Check for app_role override (user_roles table)
  SELECT ur.role::text
  INTO v_app_role
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
  LIMIT 1;

  -- 3. Determine effective role (app_role takes precedence)
  IF v_app_role IS NOT NULL AND v_app_role IN ('super_user', 'platform_admin') THEN
    v_effective_role := v_app_role;
  ELSIF v_app_role IS NOT NULL THEN
    v_effective_role := v_app_role;
  ELSE
    v_effective_role := v_membership_role;
  END IF;

  -- 4. Get target tiles for effective role
  v_target_tiles := get_tiles_for_role(v_effective_role);

  -- 5. Insert missing tiles
  FOREACH v_tile IN ARRAY v_target_tiles
  LOOP
    INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_by)
    VALUES (v_tenant_id, v_tile, 'active', p_user_id)
    ON CONFLICT (tenant_id, tile_code) 
    DO UPDATE SET status = 'active', activated_at = now();
  END LOOP;

  -- 6. Deactivate tiles not in target set
  UPDATE tenant_tile_activation
  SET status = 'inactive', deactivated_at = now()
  WHERE tenant_id = v_tenant_id
    AND status = 'active'
    AND NOT (tile_code = ANY(v_target_tiles));
END;
$function$;

-- ============================================================
-- 3. Bernhards fehlende Tiles einfuegen (Super-User = alle 22)
-- ============================================================
DO $$
DECLARE
  v_tenant_id uuid := '80746f1a-6072-48ff-bca1-753dec78fdf0';
  v_all_tiles text[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
    'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
    'MOD-18','MOD-19','MOD-20','MOD-22'
  ];
  v_tile text;
BEGIN
  FOREACH v_tile IN ARRAY v_all_tiles
  LOOP
    INSERT INTO tenant_tile_activation (tenant_id, tile_code, status)
    VALUES (v_tenant_id, v_tile, 'active')
    ON CONFLICT (tenant_id, tile_code) 
    DO UPDATE SET status = 'active', activated_at = now();
  END LOOP;
END $$;
