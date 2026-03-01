-- Add signature_url column to profiles for letter signature image
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;