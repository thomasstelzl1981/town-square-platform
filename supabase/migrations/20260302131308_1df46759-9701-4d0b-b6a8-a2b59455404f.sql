ALTER TABLE rental_publications 
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz;