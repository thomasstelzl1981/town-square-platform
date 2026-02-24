-- ENG-MKTDIR: Quality-Felder am Kontakt
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS quality_status text DEFAULT 'candidate';