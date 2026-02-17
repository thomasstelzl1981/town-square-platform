
-- Extend pet_z1_pets to match Z2 pets table standard (Pet-Card SSOT)
-- Missing fields: vet_name, photo_url (insurance stays Z2-only)

ALTER TABLE public.pet_z1_pets
  ADD COLUMN IF NOT EXISTS vet_name text,
  ADD COLUMN IF NOT EXISTS photo_url text;

-- Add comment documenting the Pet-Card standard
COMMENT ON TABLE public.pet_z1_pets IS 'Zone 1/3 Pet Profile — mirrors Z2 pets table structure. Fields: Stammdaten (name, species, breed, gender, birth_date, weight_kg), Identifikation (chip_number, neutered), Gesundheit (vet_name, allergies), Medien (photo_url), Notizen (notes). Insurance fields are Z2-only (pets table).';
