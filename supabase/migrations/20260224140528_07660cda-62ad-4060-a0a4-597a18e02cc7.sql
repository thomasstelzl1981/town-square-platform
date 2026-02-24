
CREATE OR REPLACE FUNCTION public.enforce_org_hierarchy_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service-role (no JWT = server-side call) to update org_type
  IF current_setting('request.jwt.claim.role', true) IS NULL 
     OR current_setting('request.jwt.claim.role', true) = '' 
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block org_type changes from regular users
  IF OLD.org_type IS DISTINCT FROM NEW.org_type THEN
    RAISE EXCEPTION 'org_type cannot be changed after creation';
  END IF;

  RETURN NEW;
END;
$$;
