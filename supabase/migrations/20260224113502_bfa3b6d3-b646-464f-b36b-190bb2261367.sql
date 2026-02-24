
-- automation_settings: key-value store for scheduler config
CREATE TABLE public.automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read
CREATE POLICY "Authenticated users can read automation settings"
  ON public.automation_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update automation settings"
  ON public.automation_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can insert
CREATE POLICY "Authenticated users can insert automation settings"
  ON public.automation_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert initial scheduler config
INSERT INTO public.automation_settings (setting_key, setting_value)
VALUES ('discovery_scheduler', '{"active": false, "cron_schedule": "0 6 * * *", "target_per_day": 500, "max_credits_per_day": 200}');
