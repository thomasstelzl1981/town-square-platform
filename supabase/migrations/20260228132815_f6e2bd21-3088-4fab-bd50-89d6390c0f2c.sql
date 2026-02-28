-- Make user_id nullable so brand-level assistants (Zone 1) don't need a user_id
ALTER TABLE public.commpro_phone_assistants ALTER COLUMN user_id DROP NOT NULL;