
-- ============================================================
-- Super-Manager Rolle: Enum + get_tiles_for_role() Update
-- ============================================================

-- 1. membership_role Enum erweitern
ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'super_manager';

-- 2. Overload 1: get_tiles_for_role(p_role text) — aktualisieren
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
    WHEN 'super_manager' THEN
      -- Alle Module AUSSER MOD-22 (Pet Manager) = 21 Module
      RETURN ARRAY[
        'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
        'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
        'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
        'MOD-18','MOD-19','MOD-20'
      ];
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

-- 3. Overload 2: get_tiles_for_role(_role membership_role) — aktualisieren
CREATE OR REPLACE FUNCTION public.get_tiles_for_role(_role public.membership_role)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_tiles TEXT[] := ARRAY[
    'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
    'MOD-06','MOD-07','MOD-08','MOD-15','MOD-16','MOD-17',
    'MOD-18','MOD-20'
  ];
BEGIN
  CASE _role
    WHEN 'platform_admin' THEN
      RETURN ARRAY[
        'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
        'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
        'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
        'MOD-18','MOD-19','MOD-20','MOD-22'
      ];
    WHEN 'org_admin' THEN
      RETURN base_tiles;
    WHEN 'super_manager' THEN
      -- Alle Module AUSSER MOD-22 (Pet Manager) = 21 Module
      RETURN ARRAY[
        'MOD-00','MOD-01','MOD-02','MOD-03','MOD-04','MOD-05',
        'MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11',
        'MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17',
        'MOD-18','MOD-19','MOD-20'
      ];
    WHEN 'sales_partner' THEN
      RETURN base_tiles || ARRAY['MOD-09','MOD-10'];
    WHEN 'finance_manager' THEN
      RETURN base_tiles || ARRAY['MOD-11'];
    WHEN 'akquise_manager' THEN
      RETURN base_tiles || ARRAY['MOD-12'];
    WHEN 'project_manager' THEN
      RETURN base_tiles || ARRAY['MOD-13'];
    WHEN 'pet_manager' THEN
      RETURN base_tiles || ARRAY['MOD-22'];
    ELSE
      RETURN base_tiles;
  END CASE;
END;
$$;
