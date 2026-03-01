-- Activate the Ncore brand assistant (number is already assigned, just needs is_enabled = true)
UPDATE public.commpro_phone_assistants
SET is_enabled = true, updated_at = now()
WHERE id = 'e0f9c5ff-3fe7-4ef1-b7e7-f77d8d11fd9e';