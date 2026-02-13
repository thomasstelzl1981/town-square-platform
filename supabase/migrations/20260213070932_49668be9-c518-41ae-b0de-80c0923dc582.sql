
-- Step 1: Make mandate_id nullable for global property pool
ALTER TABLE acq_offers ALTER COLUMN mandate_id DROP NOT NULL;

-- Step 2: Add provider and received_at columns
ALTER TABLE acq_offers ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE acq_offers ADD COLUMN IF NOT EXISTS provider_contact TEXT;
ALTER TABLE acq_offers ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ DEFAULT now();

-- Step 3: Backfill received_at from created_at for existing rows
UPDATE acq_offers SET received_at = created_at WHERE received_at IS NULL;

-- Step 4: Backfill provider_name from extracted_data if available
UPDATE acq_offers 
SET provider_name = extracted_data->>'source' 
WHERE provider_name IS NULL 
  AND extracted_data->>'source' IS NOT NULL;
