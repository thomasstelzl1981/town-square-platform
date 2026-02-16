ALTER TABLE public.vorsorge_contracts
  ADD COLUMN IF NOT EXISTS bu_monthly_benefit numeric DEFAULT NULL;

COMMENT ON COLUMN public.vorsorge_contracts.bu_monthly_benefit
  IS 'BU-Rente in EUR/mtl. — auch bei Kombiprodukten (z.B. Ruerup+BU)';
