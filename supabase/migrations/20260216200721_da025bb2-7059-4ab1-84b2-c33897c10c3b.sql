-- Add cover_image_url and service_area_postal_codes to pet_providers
ALTER TABLE public.pet_providers ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.pet_providers ADD COLUMN IF NOT EXISTS service_area_postal_codes TEXT[];

-- Add puppy_class to pet_service_category enum
ALTER TYPE public.pet_service_category ADD VALUE IF NOT EXISTS 'puppy_class';
