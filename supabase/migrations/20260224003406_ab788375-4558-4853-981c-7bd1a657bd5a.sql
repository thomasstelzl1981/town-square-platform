
-- =====================================================
-- SoT-Fallback-E-Mail: sot_email auf profiles
-- =====================================================

-- 1. Spalte + Index
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sot_email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_sot_email ON public.profiles(sot_email) WHERE sot_email IS NOT NULL;

-- 2. Generierungsfunktion
CREATE OR REPLACE FUNCTION public.generate_sot_email(
  p_first_name TEXT,
  p_last_name TEXT,
  p_auth_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base TEXT;
  v_first TEXT;
  v_last TEXT;
  v_candidate TEXT;
  v_suffix INT := 1;
BEGIN
  v_first := LOWER(COALESCE(NULLIF(TRIM(p_first_name), ''), split_part(p_auth_email, '@', 1)));
  v_last  := LOWER(COALESCE(NULLIF(TRIM(p_last_name), ''), ''));
  v_first := REPLACE(REPLACE(REPLACE(REPLACE(v_first, 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss');
  v_last  := REPLACE(REPLACE(REPLACE(REPLACE(v_last,  'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss');
  v_first := REGEXP_REPLACE(v_first, '[^a-z0-9.\-]', '', 'g');
  v_last  := REGEXP_REPLACE(v_last,  '[^a-z0-9.\-]', '', 'g');

  IF v_last = '' THEN
    v_base := v_first;
  ELSE
    v_base := v_first || '.' || v_last;
  END IF;

  IF v_base = '' OR v_base = '.' THEN
    v_base := REGEXP_REPLACE(LOWER(split_part(p_auth_email, '@', 1)), '[^a-z0-9.\-]', '', 'g');
  END IF;

  v_candidate := v_base || '@systemofatown.com';
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE sot_email = v_candidate) THEN
      RETURN v_candidate;
    END IF;
    v_suffix := v_suffix + 1;
    v_candidate := v_base || v_suffix::TEXT || '@systemofatown.com';
  END LOOP;
END;
$$;

-- 3. handle_new_user() with sot_email
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
  v_first_name text;
  v_last_name text;
BEGIN
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  org_public_id := generate_public_id('T');
  
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
  
  INSERT INTO public.profiles (
    id, email, display_name, active_tenant_id, first_name, last_name,
    sot_email
  ) VALUES (
    NEW.id, NEW.email, split_part(NEW.email, '@', 1), new_org_id,
    v_first_name, v_last_name,
    generate_sot_email(v_first_name, v_last_name, NEW.email)
  );
  
  INSERT INTO public.memberships (
    user_id, tenant_id, role
  ) VALUES (
    NEW.id, new_org_id, 'org_admin'
  );
  
  INSERT INTO public.household_persons (
    tenant_id, user_id, role, is_primary, sort_order,
    first_name, last_name, email
  ) VALUES (
    new_org_id,
    NEW.id,
    'hauptperson',
    true,
    0,
    v_first_name,
    v_last_name,
    NEW.email
  );
  
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
