-- Create function to handle new user signup bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_public_id text;
BEGIN
  -- Generate public ID for organization
  org_public_id := generate_public_id('T');
  
  -- Create default organization for new user
  INSERT INTO public.organizations (
    id,
    name,
    slug,
    org_type,
    public_id,
    depth,
    materialized_path,
    settings
  ) VALUES (
    gen_random_uuid(),
    COALESCE(split_part(NEW.email, '@', 1), 'Mein Unternehmen'),
    LOWER(REPLACE(COALESCE(split_part(NEW.email, '@', 1), 'org'), '.', '-')) || '-' || substr(md5(random()::text), 1, 6),
    'client',
    org_public_id,
    0,
    '',
    '{}'::jsonb
  )
  RETURNING id INTO new_org_id;
  
  -- Create profile for new user
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    active_tenant_id
  ) VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1),
    new_org_id
  );
  
  -- Create membership (org_admin role for own organization)
  INSERT INTO public.memberships (
    user_id,
    tenant_id,
    role
  ) VALUES (
    NEW.id,
    new_org_id,
    'org_admin'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();