
-- 1a. Add missing columns to household_persons
ALTER TABLE public.household_persons ADD COLUMN IF NOT EXISTS phone_landline TEXT;
ALTER TABLE public.household_persons ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 1b. Backfill existing primary persons from profiles
UPDATE public.household_persons hp
SET
  phone_landline = p.phone_landline,
  avatar_url = p.avatar_url,
  street = COALESCE(hp.street, p.street),
  house_number = COALESCE(hp.house_number, p.house_number),
  zip = COALESCE(hp.zip, p.postal_code),
  city = COALESCE(hp.city, p.city),
  phone = COALESCE(hp.phone, p.phone_mobile)
FROM public.profiles p
WHERE hp.user_id = p.id
  AND hp.is_primary = true;

-- 1c. Sync trigger: profiles -> household_persons (primary person only)
CREATE OR REPLACE FUNCTION public.sync_profile_to_primary_person()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.household_persons
  SET
    first_name = NEW.first_name,
    last_name = NEW.last_name,
    email = NEW.email,
    street = NEW.street,
    house_number = NEW.house_number,
    zip = NEW.postal_code,
    city = NEW.city,
    phone_landline = NEW.phone_landline,
    phone = NEW.phone_mobile,
    avatar_url = NEW.avatar_url,
    updated_at = now()
  WHERE user_id = NEW.id
    AND is_primary = true;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_household ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_household
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_primary_person();
