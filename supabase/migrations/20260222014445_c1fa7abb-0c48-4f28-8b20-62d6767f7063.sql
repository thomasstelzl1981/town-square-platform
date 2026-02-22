
-- Zone 3 Website Settings (Key-Value Store)
CREATE TABLE public.zone3_website_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL DEFAULT 'true',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.zone3_website_settings ENABLE ROW LEVEL SECURITY;

-- SELECT for anon + authenticated (websites need to read)
CREATE POLICY "zone3_ws_select_all"
  ON public.zone3_website_settings
  FOR SELECT
  USING (true);

-- INSERT/UPDATE only for authenticated
CREATE POLICY "zone3_ws_insert_auth"
  ON public.zone3_website_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "zone3_ws_update_auth"
  ON public.zone3_website_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed: PIN gate enabled by default
INSERT INTO public.zone3_website_settings (key, value)
VALUES ('pin_gate_enabled', 'true');
