
-- =============================================
-- PetDossier: Extend pets table with full dossier fields
-- + Create pet-photos storage bucket
-- =============================================

-- 1) Add missing columns to pets table
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
  ADD COLUMN IF NOT EXISTS vet_practice TEXT,
  ADD COLUMN IF NOT EXISTS vet_phone TEXT,
  ADD COLUMN IF NOT EXISTS intolerances TEXT[],
  ADD COLUMN IF NOT EXISTS food_brand TEXT,
  ADD COLUMN IF NOT EXISTS food_amount TEXT,
  ADD COLUMN IF NOT EXISTS food_frequency TEXT,
  ADD COLUMN IF NOT EXISTS food_notes TEXT,
  ADD COLUMN IF NOT EXISTS grooming_notes TEXT,
  ADD COLUMN IF NOT EXISTS insurance_type TEXT,
  ADD COLUMN IF NOT EXISTS insurance_premium_monthly NUMERIC,
  ADD COLUMN IF NOT EXISTS insurance_deductible NUMERIC,
  ADD COLUMN IF NOT EXISTS insurance_valid_until DATE,
  ADD COLUMN IF NOT EXISTS compatible_dogs BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS compatible_cats BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS compatible_children BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS leash_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS muzzle_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_level TEXT,
  ADD COLUMN IF NOT EXISTS fears TEXT[],
  ADD COLUMN IF NOT EXISTS behavior_notes TEXT;

-- 2) Create pet-photos storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet-photos', 'pet-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3) Storage RLS policies for pet-photos
CREATE POLICY "Anyone can view pet photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');

CREATE POLICY "Authenticated users can upload pet photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pet-photos');

CREATE POLICY "Authenticated users can update their pet photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'pet-photos');

CREATE POLICY "Authenticated users can delete their pet photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pet-photos');
