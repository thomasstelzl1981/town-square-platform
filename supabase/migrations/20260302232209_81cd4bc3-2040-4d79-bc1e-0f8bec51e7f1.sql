
-- Harden handle_new_user: use display_name as fallback before email prefix
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
  v_display_name text;
BEGIN
  -- Priority: explicit first_name > split display_name > email prefix
  v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', '');
  v_first_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
    NULLIF(split_part(v_display_name, ' ', 1), ''),
    split_part(NEW.email, '@', 1)
  );
  v_last_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(TRIM(SUBSTRING(v_display_name FROM POSITION(' ' IN v_display_name))), ''),
    ''
  );

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
    NEW.id, NEW.email,
    CASE WHEN v_last_name <> '' THEN v_first_name || ' ' || v_last_name ELSE v_first_name END,
    new_org_id,
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

  -- Default "Privat"-Kontext für jeden neuen Tenant
  INSERT INTO public.landlord_contexts (
    tenant_id, name, context_type, is_default
  ) VALUES (
    new_org_id, 'Privat', 'PRIVATE', true
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
