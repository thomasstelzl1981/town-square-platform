
-- ═══════════════════════════════════════════════════════════════
-- GP-PET SSOT: Add postal_code + city to pet_customers (Z2)
-- Matching pet_z1_customers (Z1) for consistency
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.pet_customers
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text;
