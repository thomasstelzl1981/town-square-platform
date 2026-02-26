
-- Teil 2: Armstrong-E-Mail-Adresse für jeden User
-- Neue Spalte in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS armstrong_email TEXT;

-- Generierungsfunktion für Armstrong-Adressen
CREATE OR REPLACE FUNCTION public.generate_armstrong_email(
  p_first_name TEXT,
  p_last_name TEXT,
  p_auth_email TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
  v_counter INT := 0;
  v_domain TEXT := 'neilarmstrong.space';
BEGIN
  -- Normalize names (umlauts, lowercase, trim)
  v_base := lower(trim(COALESCE(p_first_name, '')));
  IF v_base = '' THEN
    v_base := lower(split_part(p_auth_email, '@', 1));
  END IF;
  
  -- Add last name if available
  IF COALESCE(p_last_name, '') <> '' THEN
    v_base := v_base || '.' || lower(trim(p_last_name));
  END IF;
  
  -- Replace umlauts
  v_base := replace(v_base, 'ä', 'ae');
  v_base := replace(v_base, 'ö', 'oe');
  v_base := replace(v_base, 'ü', 'ue');
  v_base := replace(v_base, 'ß', 'ss');
  
  -- Remove non-alphanumeric except dots
  v_base := regexp_replace(v_base, '[^a-z0-9.]', '', 'g');
  
  -- Remove consecutive dots and leading/trailing dots
  v_base := regexp_replace(v_base, '\.{2,}', '.', 'g');
  v_base := trim(both '.' from v_base);
  
  IF v_base = '' THEN
    v_base := 'user';
  END IF;
  
  v_candidate := v_base || '@' || v_domain;
  
  -- Check for duplicates
  WHILE EXISTS (SELECT 1 FROM profiles WHERE armstrong_email = v_candidate) LOOP
    v_counter := v_counter + 1;
    v_candidate := v_base || v_counter::TEXT || '@' || v_domain;
  END LOOP;
  
  RETURN v_candidate;
END;
$$;

-- Backfill: Generate armstrong_email for all existing users who don't have one
UPDATE profiles
SET armstrong_email = generate_armstrong_email(first_name, last_name, email)
WHERE armstrong_email IS NULL AND email IS NOT NULL;

-- Update handle_new_user to also generate armstrong_email
-- We need to check current trigger function and add armstrong_email generation
-- Instead of modifying the trigger (risky), we create a separate trigger
CREATE OR REPLACE FUNCTION public.set_armstrong_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.armstrong_email IS NULL AND NEW.email IS NOT NULL THEN
    NEW.armstrong_email := generate_armstrong_email(
      COALESCE(NEW.first_name, ''),
      COALESCE(NEW.last_name, ''),
      COALESCE(NEW.email, '')
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_armstrong_email
BEFORE INSERT OR UPDATE OF first_name, last_name ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_armstrong_email();

-- Teil 3: Armstrong Inbound Tasks Tabelle
CREATE TABLE public.armstrong_inbound_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments_meta JSONB DEFAULT '[]'::jsonb,
  instruction TEXT,
  action_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.armstrong_inbound_tasks ENABLE ROW LEVEL SECURITY;

-- Users can see their own tasks
CREATE POLICY "Users can view own armstrong tasks"
ON public.armstrong_inbound_tasks
FOR SELECT
USING (auth.uid() = user_id);

-- Service role inserts (from edge function)
CREATE POLICY "Service role can insert armstrong tasks"
ON public.armstrong_inbound_tasks
FOR INSERT
WITH CHECK (true);

-- Service role updates
CREATE POLICY "Service role can update armstrong tasks"
ON public.armstrong_inbound_tasks
FOR UPDATE
USING (true);

-- Index for efficient queries
CREATE INDEX idx_armstrong_tasks_user_status ON public.armstrong_inbound_tasks(user_id, status);
CREATE INDEX idx_armstrong_tasks_pending ON public.armstrong_inbound_tasks(status) WHERE status = 'pending';
