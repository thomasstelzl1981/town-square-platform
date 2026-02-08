-- Add auto-enrich columns to tenant_extraction_settings
ALTER TABLE public.tenant_extraction_settings 
ADD COLUMN IF NOT EXISTS auto_enrich_contacts_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_enrich_contacts_post BOOLEAN DEFAULT false;