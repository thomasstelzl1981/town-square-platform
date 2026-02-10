
-- Insert 4 storage plans into plans table
INSERT INTO public.plans (id, name, description, price_cents, currency, interval, features, is_active, display_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Free', 'Kostenloser Einstieg mit 5 GB Speicher', 0, 'EUR', 'monthly', '{"storage_gb": 5, "credits_monthly": 0}', true, 1),
  ('00000000-0000-0000-0000-000000000002', 'Basic', '25 GB Speicher für kleine Teams', 499, 'EUR', 'monthly', '{"storage_gb": 25, "credits_monthly": 20}', true, 2),
  ('00000000-0000-0000-0000-000000000003', 'Pro', '100 GB Speicher für wachsende Unternehmen', 1499, 'EUR', 'monthly', '{"storage_gb": 100, "credits_monthly": 60}', true, 3),
  ('00000000-0000-0000-0000-000000000004', 'Business', '500 GB Speicher für große Organisationen', 3999, 'EUR', 'monthly', '{"storage_gb": 500, "credits_monthly": 160}', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Add storage_plan_id and storage_quota_bytes to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS storage_plan_id UUID REFERENCES public.plans(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD COLUMN IF NOT EXISTS storage_quota_bytes BIGINT DEFAULT 5368709120;
