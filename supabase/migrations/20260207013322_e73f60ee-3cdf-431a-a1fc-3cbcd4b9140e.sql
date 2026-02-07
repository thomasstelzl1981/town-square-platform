-- Security Fix: Set search_path on functions (corrected version)
-- Note: is_platform_admin has multiple overloads, we fix each explicitly

-- Fix update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Fix is_platform_admin(uuid) if exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.proname = 'is_platform_admin'
    AND p.pronargs = 1
  ) THEN
    EXECUTE 'ALTER FUNCTION public.is_platform_admin(uuid) SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter is_platform_admin(uuid): %', SQLERRM;
END $$;

-- Fix is_platform_admin() if exists (no args version)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.proname = 'is_platform_admin'
    AND p.pronargs = 0
  ) THEN
    EXECUTE 'ALTER FUNCTION public.is_platform_admin() SET search_path = public';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not alter is_platform_admin(): %', SQLERRM;
END $$;