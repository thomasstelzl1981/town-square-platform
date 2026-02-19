-- Increase public-intake bucket file size limit to 20MB
UPDATE storage.buckets 
SET file_size_limit = 20971520  -- 20MB
WHERE id = 'public-intake';