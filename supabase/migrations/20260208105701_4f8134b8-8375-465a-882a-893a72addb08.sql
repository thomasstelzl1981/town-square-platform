-- Phase 1: Golden Path - Set public_id for Leipzig listing
UPDATE listings 
SET 
  public_id = 'leipzig-' || substring(id::text, 1, 8),
  updated_at = now()
WHERE id = 'ed4d1e46-083a-46bc-aa94-e21f3f2b4e4e'
  AND public_id IS NULL;