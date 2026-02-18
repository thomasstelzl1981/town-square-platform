
-- Add web_form_id column to finapi_connections for Web Form 2.0 flow
ALTER TABLE public.finapi_connections 
ADD COLUMN IF NOT EXISTS web_form_id text;
