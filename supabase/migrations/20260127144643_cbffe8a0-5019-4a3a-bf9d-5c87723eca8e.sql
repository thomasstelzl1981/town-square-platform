-- Phase 2: landlord_contexts um Adress-Felder für Briefkopf erweitern
ALTER TABLE landlord_contexts 
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS house_number TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland',
ADD COLUMN IF NOT EXISTS hrb_number TEXT,
ADD COLUMN IF NOT EXISTS ust_id TEXT,
ADD COLUMN IF NOT EXISTS legal_form TEXT;