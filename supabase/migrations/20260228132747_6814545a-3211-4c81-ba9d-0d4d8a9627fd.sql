-- Remove the unique constraint on user_id to allow one user to create multiple brand assistants
ALTER TABLE public.commpro_phone_assistants DROP CONSTRAINT IF EXISTS commpro_phone_assistants_user_id_key;

-- Add a composite unique constraint instead: one user can have one personal assistant (brand_key IS NULL)
-- and each brand_key can only exist once
CREATE UNIQUE INDEX IF NOT EXISTS idx_commpro_phone_user_personal 
  ON public.commpro_phone_assistants (user_id) 
  WHERE brand_key IS NULL;
