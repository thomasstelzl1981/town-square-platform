
-- Tabelle: user_outbound_identities
CREATE TABLE public.user_outbound_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_key TEXT NOT NULL,
  from_email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nur eine aktive Identity pro User
CREATE UNIQUE INDEX idx_user_outbound_active 
  ON public.user_outbound_identities (user_id) 
  WHERE is_active = true;

-- Performance index
CREATE INDEX idx_user_outbound_user ON public.user_outbound_identities (user_id);

-- RLS
ALTER TABLE public.user_outbound_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outbound identity"
  ON public.user_outbound_identities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own outbound identity"
  ON public.user_outbound_identities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own outbound identity"
  ON public.user_outbound_identities FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access on outbound identities"
  ON public.user_outbound_identities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_user_outbound_identities_updated_at
  BEFORE UPDATE ON public.user_outbound_identities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC for Edge Functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_active_outbound_identity(p_user_id UUID)
RETURNS TABLE(brand_key TEXT, from_email TEXT, display_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT brand_key, from_email, display_name
  FROM public.user_outbound_identities
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
$$;
