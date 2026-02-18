-- Add column for FinAPI user password storage (needed for password grant flow)
ALTER TABLE public.finapi_connections
ADD COLUMN IF NOT EXISTS finapi_user_password text;